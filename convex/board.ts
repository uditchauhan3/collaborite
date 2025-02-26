import { v } from "convex/values";
import {mutation} from "./_generated/server";

const images=[
    "/public/placeholder/1.svg",
    "/public/placeholder/2.svg",
    "/public/placeholder/3.svg",
    "/public/placeholder/4.svg",
    "/public/placeholder/5.svg",
    "/public/placeholder/6.svg",
    "/public/placeholder/7.svg",
    "/public/placeholder/8.svg",
    "/public/placeholder/9.svg",
    "/public/placeholder/10.svg",
]


export const create = mutation({
    args:{
        orgId: v.string(),
        title: v.string(),
    },
    handler: async(ctx , args) =>{
        const identity =await ctx.auth.getUserIdentity();

        if(!identity){
            throw new Error("Unauthorized");
        }

        const randomImage=images[Math.floor(Math.random()*images.length)]

        const board = await ctx.db.insert("boards",{
            title:args.title,
            orgId: args.orgId,
            authorId:identity.subject,
            authorName:identity.name!,
            imageUrl:randomImage,
        });

        return board;

    }
})