import { PrismaClient, User } from '@prisma/client';
 
import axios from "axios";
import JWTService from './jwt';
import { prismaClient } from '../clients/db';


const prisma = new PrismaClient();

interface GoogleTokenResult {
    
        iss?: string,
        azp?: string,
        aud?: string,
        sub?: string,
        email: string,
        email_verified: string,
        nbf?: string,
        name?: string,
        given_name: string,
        family_name?: string,
        picture?: string,
        iat?: string,
        exp?: string,
        jti?: string,
        alg?: string,
        kid?: string,
        typ?: string
      
}

class UserService {


    public static async verifyGoogleAuthToken(token: string){

        const googleToken = token;
        const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
         googleOauthURL.searchParams.set("id_token", googleToken);
     
         const {data} = await axios.get<GoogleTokenResult>(googleOauthURL.toString(), {
             responseType: 'json'
         });
     //    console.log(data); 
        const user  = await prisma.user.findUnique({where: {email: data.email}})
     //    console.log("user===",  data);
        
     //   console.log(user);
       if(!user){
           await prisma.user.create({
               data: {
                   email: data.email,
                   firstName: data.given_name,
                   lastName: data.family_name,
                   profileImageURL: data.picture
               }
           })	
         }
         const userInDb  = await prisma.user.findUnique({where: {email: data.email}})
     
         if(!userInDb)  throw new Error('User not found');   
     
         const userToken = await JWTService.generateToken(userInDb);
         return userToken;
    }
    public static getUserById(id: string){
        return prisma.user.findUnique({where: {id}})
    }
    public static followUser(from: string, to: string){
        return prismaClient.follows.create({
              data: {
                follower: {connect: {id: from}},
                following: {connect: {id: to}}
              }
        })
    }
    public static unfollowUser(from: string, to: string){
        return prismaClient.follows.delete({
              where: {followerId_followingId: {followerId: from, followingId: to} }
        })
    }
}


export default UserService;