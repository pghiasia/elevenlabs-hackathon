import { ElevenLabsClient } from "elevenlabs";
import * as dotenv from "dotenv";

dotenv.config();

const ELEVENLABS_API_KEY = 'sk_54979d6a0ffced65ce14108910306c05c7944944bd50c99f';

if (!ELEVENLABS_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY in environment variables");
}

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

export const createAudioStreamFromText = async (
  text: string,
): Promise<Buffer> => {
  const audioStream = await client.generate({
    voice: "Sully",
    model_id: "eleven_turbo_v2_5",
    text,
  });

  const chunks: Buffer[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }

  const content = Buffer.concat(chunks);
  return content;
};
