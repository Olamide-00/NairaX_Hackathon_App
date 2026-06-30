import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";
import { HTTP } from "..";


export const validate =
  (schema: ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {

    try {
      let dataToValidate = req.body;
      const shape = schema.shape;
      if ("body" in shape) {
        dataToValidate = {
          body: req.body,
          params: req.params,
          query: req.query,
        };

      }



      const validated =
        schema.parse(dataToValidate);
      if ("body" in shape) {

        req.body = validated.body;

      } else {

        req.body = validated;

      }
      next();


    } catch (err) {


      if (err instanceof ZodError) {


        const errors =
          err.issues.map((e) => ({

            field:
              e.path.join("."),

            message:
              e.message,

          }));


        res.status(HTTP.BAD_REQUEST).json({

          success:false,

          errors,

        });

        return;

      }


      next(err);

    }

  };