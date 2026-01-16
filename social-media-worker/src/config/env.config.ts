import dotenv from "dotenv"
dotenv.config();

// const required = (key: string): string => {
//   const value = process.env[key];
//   if (!value) {
//     throw new Error(`😭 Missing environment variable: ${key}  ⚠️❗`);
//   }
//   return value;
// };


export const ENV =  {
   APP: {
    PORT: Number(process.env.PORT ?? 8080),
  },
}