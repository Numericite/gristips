// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import {
  withErrorHandling,
  validateHttpMethod,
} from "../../lib/error-handling";

type Data = {
  name: string;
  timestamp: string;
};

async function helloHandler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // Valider la méthode HTTP
  if (!validateHttpMethod(req, res, ["GET"])) {
    return;
  }

  res.status(200).json({
    name: "John Doe",
    timestamp: new Date().toISOString(),
  });
}

export default withErrorHandling(helloHandler, {
  action: "hello_api",
});
