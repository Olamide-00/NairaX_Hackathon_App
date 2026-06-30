import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();


interface Bank {
  code: string;
  name: string;
}


interface LookupResponse {
  accountNumber: string;
  accountName: string;
}


export interface TransferPayload {
  amount: number;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  merchantTxRef: string;
  senderName: string;
  narration?: string;
}



export class NombaTransferError extends Error {

  description?: string;
  statusCode?: number;


  constructor(
    message: string,
    description?: string,
    statusCode?: number
  ) {

    super(message);

    this.name = "NombaTransferError";

    this.description = description;
    this.statusCode = statusCode;
  }
}




let accessToken: string | null = null;
let tokenExpiry: number | null = null;




async function getToken(): Promise<string> {


  if (
    accessToken &&
    tokenExpiry &&
    Date.now() < tokenExpiry
  ) {
    return accessToken;
  }



  try {


    const response = await axios.post(

      `${process.env.NOMBA_BASE_URL}/v1/auth/token/issue`,

      {
        grant_type: "client_credentials",
        client_id: process.env.NOMBA_CLIENT_ID,
        client_secret: process.env.NOMBA_CLIENT_SECRET,
      },


      {
        headers: {
          accountId: process.env.NOMBA_ACCOUNT_ID,
          "Content-Type": "application/json",
        },
      }

    );



    accessToken =
      response.data.data.access_token;



    tokenExpiry =
      Date.now() + (25 * 60 * 1000);



    if (!accessToken) {
      throw new Error("No token returned from Nomba");
    }


    return accessToken;



  } catch(error) {


    const err =
      error as AxiosError<any>;


    throw new NombaTransferError(

      "Unable to authenticate with Nomba",

      err.response?.data?.description ||
      err.message,

      err.response?.status

    );

  }

}







export const transferService = {



  /**
   * GET ALL BANKS
   */
  
    async getBanks(): Promise<Bank[]> {

  try {

    const token = await getToken();


    const response = await axios.get(

      `${process.env.NOMBA_BASE_URL}/v1/transfers/banks`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
          accountId: process.env.NOMBA_ACCOUNT_ID,
          "Content-Type": "application/json"
        }
      }

    );


    console.log(
      "NOMBA BANK RESPONSE:",
      JSON.stringify(response.data, null, 2)
    );


    return response.data ?? [];


  } catch(error) {

    const err =
      error as AxiosError<any>;


    throw new NombaTransferError(
      "Unable to fetch banks",
      err.response?.data?.description ||
      err.message,
      err.response?.status
    );

  }

},
    
  







  /**
   * VERIFY ACCOUNT
   */
  async lookupAccount(
    accountNumber:string,
    bankCode:string

  ):Promise<LookupResponse>{



    try {


      const token =
        await getToken();



      const response =
        await axios.post(


          `${process.env.NOMBA_BASE_URL}/v1/transfers/bank/lookup`,


          {
            accountNumber,
            bankCode
          },


          {
            headers: {

              Authorization:
                `Bearer ${token}`,

              accountId:
                process.env.NOMBA_ACCOUNT_ID,

              "Content-Type":
                "application/json"
            }
          }

        );



      return response.data.data;



    } catch(error){


      const err =
        error as AxiosError<any>;



      throw new NombaTransferError(

        "Unable to lookup account",

        err.response?.data?.description ||
        err.message,

        err.response?.status

      );

    }

  },









  /**
   * SEND TRANSFER
   */
  async transfer(
    payload:TransferPayload
  ){



    try {


      const token =
        await getToken();



      const response =
        await axios.post(


          `${process.env.NOMBA_BASE_URL}/v2/transfers/bank`,


          payload,


          {

            headers: {

              Authorization:
                `Bearer ${token}`,


              accountId:
                process.env.NOMBA_ACCOUNT_ID,


              "Content-Type":
                "application/json"

            }

          }


        );



      return response.data;



    } catch(error){



      const err =
        error as AxiosError<any>;



      throw new NombaTransferError(

        "Transfer failed",

        err.response?.data?.description ||
        err.response?.data?.message ||
        err.message,

        err.response?.status

      );


    }


  }




};