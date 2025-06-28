import express from 'express'
import { ApolloServer } from '@apollo/server'

import {expressMiddleware} from '@apollo/server/express4'

import bodyParser from 'body-parser';

import {prismaClient} from '../clients/db'
import { User } from './user';
import { Tweet } from './tweet';
import cors from 'cors';
import { GraphqlContext } from '../interfaces';
import JWTService from '../services/jwt';
export async function initServer(){
    
    const app  = express();

    app.use(bodyParser.json())
    // prismaClient.user.create({
    //     data: {}
    // })

    app.use(cors())
    const graphqlServer  = new ApolloServer<GraphqlContext>({
        typeDefs:`
          ${User.types}
          ${Tweet.types}
          type Query{
                    ${User.queries}
                    ${Tweet.queries}
          }

          type Mutation {
              ${Tweet.mutations}
              ${User.mutations}
              
          } 
         
        `,
        resolvers:{
            Query: {
               ...User.resolvers.queries,
               ...Tweet.resolvers.queries
                
            },
            Mutation: {
                ...Tweet.resolvers.mutations,
                ...User.resolvers.mutations
            },
            ...User.resolvers.extraResolvers,
            ...Tweet.resolvers.extraResolvers
        }

    });

    await graphqlServer.start()

    app.use('/graphql', expressMiddleware(graphqlServer, {

      
        context: async ({req,res}) => {
            let user = null
            // console.log("req.headers.authorization=================>", req.headers.authorization?true:false)
            if(req.headers.authorization){
                // console.log("req.headers.authorization=================>auth", req.headers.authorization)
                const tokenPart =req.headers.authorization.split("Bearer ")[1]
                // console.log("req.headers.authorization=================>tokenpart",tokenPart)
                user = await JWTService.decodeToken(tokenPart)
                // console.log("inside user token=================>", user)
            }
            //  console.log("useruseruseruseruseruser=================>", user)
            return {
                user: user
            }
        }	
    }))

    return app

}