import { Tweet } from "@prisma/client";
import {S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayload } from "../../services/tweet";
// import redisClient from "../../clients/redis";
 console.log("AWS_REGION:", process.env.AWS_DEFAULT_REGION,  process.env.AWS_S3_BUCKET);
const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "ap-south-1" })


const mutations = {
    CreateTweet:async (parent:any,
         {payload}:{ payload:CreateTweetPayload}, 
         ctx: GraphqlContext)=>{

          if(!ctx.user) throw new Error('You are not authenticated!')
   
          const tweet = await  TweetService.createTweet({
            ...payload,
            userId: ctx.user.id
          })
           return tweet;

    }
}

const queries = {

    getAllTweets:async ()=>{

        return await TweetService.getAllTweets();
    },
    getSignedURLForTweet: async (parent: any, {imageType, imageName}: {imageType: string, imageName:string},
        ctx: GraphqlContext
    )=>{
        if(!ctx.user || ! ctx.user.id) throw new Error('Unauthorized!');

        const allowedImageTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"]


        if(!allowedImageTypes.includes(imageType))
            throw new Error("Unsupported Image Type");

        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,  
            ContentType: imageType,          
            Key: `uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}`
        });
        const signedURL = await getSignedUrl(s3Client, putObjectCommand);
        console.log("Redis clientttt===")
        // redisClient.set('USERPROFILE-'+ctx.user.id, JSON.stringify(ctx.user))

        return signedURL;
    }
}


const extraResolvers = {

    Tweet : {
        author: async (parent: Tweet)=>{ 
           return await UserService.getUserById(parent.autherId)
           
        }
    }
}


export const resolvers = {mutations, extraResolvers, queries}