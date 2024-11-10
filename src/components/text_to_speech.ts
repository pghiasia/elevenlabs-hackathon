import { ElevenLabsClient } from "elevenlabs";
import * as dotenv from "dotenv";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  throw new Error("Missing ELEVENLABS_API_KEY in environment variables");
}

const client = new ElevenLabsClient({
  apiKey: ELEVENLABS_API_KEY,
});

// Define voice IDs for each category and gender
const CATEGORY_VOICES = {
  "Presentation": {
    male: "Brian",
    female: "Matilda"
  },
  "Debate Coach": {
    male: "Marshal",
    female: "Rachel"
  },
  "Interview Prep": {
    male: "Sully",
    female: "Sarah"
  }
}

export const createAudioStreamFromText = async (
  text: string,
  category: string,
  isMaleVoice: boolean
): Promise<Buffer> => {
  const voiceId = CATEGORY_VOICES[category as keyof typeof CATEGORY_VOICES][isMaleVoice ? 'male' : 'female']
  
  const audioStream = await client.generate({
    voice: voiceId,
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
