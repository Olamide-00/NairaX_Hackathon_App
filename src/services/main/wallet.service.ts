import axios, { AxiosError } from "axios";
import dotenv from "dotenv";

dotenv.config();

export interface NombaCreateVirtualAccountPayload {
  accountRef: string;
  accountName: string;
  currency: string;
  bvn?: string;
  expectedAmount?: number;
  expiryDate?: string;
}


export interface NombaAccountData {
  createdAt: string;
  accountRef: string;
  accountHolderId: string;
  accountName: string;
  currency: string;
  bankAccountNumber: string;
  bankAccountName: string;
  bankName: string;
  bvn?: string;
  expiryDate?: string;
  expired?: boolean;
}


interface NombaTokenResponse {
  code: string;
  description: string;
  status: boolean;

  data: {
    access_token: string;
    refresh_token: string;
    expiresAt: string;
    businessId: string;
  };
}


interface NombaVirtualAccountResponse {
  code: string;
  description: string;
  status: boolean;

  data: NombaAccountData;
}



export class NombaProviderError extends Error {

  public statusCode?: number;
  public description?: string;


  constructor(
    message: string,
    description?: string,
    statusCode?: number
  ) {
    super(message);

    this.name = "NombaProviderError";

    this.description = description;
    this.statusCode = statusCode;
  }
}



let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiry: number | null = null;



const getNombaAccessToken = async (): Promise<string> => {


  if (
    accessToken &&
    tokenExpiry &&
    Date.now() < tokenExpiry
  ) {
    return accessToken;
  }


  const baseUrl = process.env.NOMBA_BASE_URL;
  const accountId = process.env.NOMBA_ACCOUNT_ID;
  const clientId = process.env.NOMBA_CLIENT_ID;
  const clientSecret = process.env.NOMBA_CLIENT_SECRET;



  if (
    !baseUrl ||
    !accountId ||
    !clientId ||
    !clientSecret
  ) {
    throw new Error(
      "Nomba environment variables missing"
    );
  }



  try {


    const response =
      await axios.post<NombaTokenResponse>(

        `${baseUrl}/v1/auth/token/issue`,

        {
          grant_type: "client_credentials",

          client_id: clientId,

          client_secret: clientSecret,
        },

        {
          timeout: 15000,

          headers: {

            accountId,

            "Content-Type":
              "application/json",
          },
        }
      );



    console.log(
      "NOMBA AUTH SUCCESS"
    );



    accessToken =
      response.data.data.access_token;


    refreshToken =
      response.data.data.refresh_token;


    // Nomba token expires in 30 minutes
    // refresh 1 minute before expiry

    tokenExpiry =
      new Date(
        response.data.data.expiresAt
      ).getTime() - 60000;



    return accessToken;



  } catch (error) {


    const err =
      error as AxiosError<any>;



    throw new NombaProviderError(

      "Nomba authentication failed",

      err.response?.data?.description ||
      err.response?.data?.message ||
      err.message,

      err.response?.status
    );

  }

};





export const nombaService = {


  async createVirtualAccount(

    payload: NombaCreateVirtualAccountPayload

  ): Promise<NombaAccountData> {



    const token =
      await getNombaAccessToken();



    const baseUrl =
      process.env.NOMBA_BASE_URL;


    const accountId =
      process.env.NOMBA_ACCOUNT_ID;



    if (
      !baseUrl ||
      !accountId
    ) {

      throw new Error(
        "Nomba configuration missing"
      );

    }



    try {


      const response =
        await axios.post<NombaVirtualAccountResponse>(


          `${baseUrl}/v1/accounts/virtual`,

          payload,


          {

            timeout: 15000,

            headers: {

              Authorization:
                `Bearer ${token}`,

              accountId,

              "Content-Type":
                "application/json",

            },

          }

        );



      return response.data.data;



    } catch(error) {


      const err =
        error as AxiosError<any>;



      console.log(
        "NOMBA CREATE ACCOUNT ERROR:",
        JSON.stringify(
          err.response?.data,
          null,
          2
        )
      );



      throw new NombaProviderError(

        "Nomba virtual account creation failed",

        err.response?.data?.description ||
        err.response?.data?.message ||
        err.message,

        err.response?.status

      );

    }

  }

};