import JWT from 'jsonwebtoken'
import { User } from '@prisma/client'
import { JWTUser } from '../interfaces'
const JWT_SECRET = "super@1234."
class JWTService { 


    public static async generateToken(user: User){        
        const payload: JWTUser = {
            id:user?.id,
            email: user?.email 
        }
        const token = JWT.sign(payload, JWT_SECRET)
        console.log(" generateToken sign=============",token);
        return token

    }
    public static async decodeToken(token: string){ 
         try{
            return	JWT.verify(token, JWT_SECRET) as JWTUser
    }catch(e){
        return null
    }
    }
}

export default JWTService