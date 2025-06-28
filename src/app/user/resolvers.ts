import axios from 'axios';

// import prismaClient from '@prisma/client'  
import { PrismaClient, User } from '@prisma/client';
const prisma = new PrismaClient();
import JWTService from '../../services/jwt';
import { GraphqlContext } from '../../interfaces';
import { prismaClient } from '../../clients/db';
import UserService from '../../services/user';
 
const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resulToken = await UserService.verifyGoogleAuthToken(token)
    return resulToken;
  
  },
  getCurrentUser: async (parent: any, args: any, context: GraphqlContext) => {
    console.log(context)
    
    const id =   context.user?.id
     
    if(!id){
       return null;
    }
    
    const user = await UserService.getUserById(id)
   
    return user;
  },
  getUserById: async (parent: any, {id}:{id:string}, ctx: GraphqlContext)=>
    UserService.getUserById(id)
};

const extraResolvers = {
     User :{
        tweets:async(parent: User)=>{          
           return  await prisma.tweet.findMany({where: {auther: {id:parent.id}}})
        },
        followers:async(parent: User)=>{          
            const res= await prisma.follows.findMany({where: {following: {id:parent.id}},
            include:{
               follower: true
            }})
            return res.map((el)=>el.follower)

         },
        following:async(parent: User)=>{          
         const res=  await prisma.follows.findMany({where: {follower: {id:parent.id}},
         include: { 
            following: true
         }
         })
         return res.map((el)=>el.following)
      },
        
     }
}

const mutations = {
   followUser: async(parent: any, {to}: {to: string}, ctx: GraphqlContext)=>{
      if(!ctx.user || !ctx.user.id) throw new Error("Uauthenticated!")
       
      await UserService.followUser(ctx.user.id, to)

      return true;     
   },
   unfollowUser: async(parent: any, {to}: {to: string}, ctx: GraphqlContext)=>{
      if(!ctx.user || !ctx.user.id) throw new Error("Uauthenticated!")
       
      await UserService.unfollowUser(ctx.user.id, to)

      return true;     
   }
}

export const resolvers = {queries, extraResolvers, mutations}