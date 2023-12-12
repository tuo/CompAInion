import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";

const password = process.env.PASSWORD;

const chatGPTConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const chatGPTApi = new OpenAIApi(chatGPTConfig);

export const config = {
  runtime: "edge",
};

export default async function handleRequest(req: Request) {
  switch (req.method) {
    case 'POST':
      return POST(req);
    case 'OPTIONS':
      return handleOptions(req);
    default:
      return new Response(null, { status: 405 });
  }
}

async function handleOptions(req: Request) {
  const headers = new Headers();
  headers.append('Access-Control-Allow-Origin', '*');
  headers.append('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.append('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(null, { headers });
}


async function POST(req: Request) {
  const headers = req.headers;
  const reqJson = await req.json();
  console.log("===reqJson", reqJson);
  const messages = reqJson?.messages;

  if (headers.get("Authorization") !== password) {
    console.log("Authorized header is not matching the password.");
    return {
      status: 401,
      body: { error: "Incorrect authorization headers was used." },
    };
  }
  console.log("===messages", messages);
  // Ask OpenAI for a streaming completion given the prompt
  const response = await chatGPTApi.createChatCompletion({
    model: "gpt-3.5-turbo",
    // model: "gpt-4", https://help.openai.com/en/articles/7102672-how-can-i-access-gpt-4
    stream: true,
    messages,
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  // Respond with the stream
  return new StreamingTextResponse(stream);
}
