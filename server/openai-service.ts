import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

export interface TranscriptionResult {
  text: string;
  title: string;
  description: string;
}

/**
 * Transcribe audio from video file and generate AI title/description
 */
export async function transcribeAndGenerateContent(audioBuffer: Buffer, originalFilename?: string): Promise<TranscriptionResult> {
  try {
    // Create a File object from buffer for OpenAI
    const audioFile = new File([audioBuffer], originalFilename || 'audio.webm', {
      type: 'audio/webm'
    });

    // Step 1: Transcribe audio using Whisper
    console.log("Starting audio transcription...");
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text"
    });

    console.log("Transcription completed, generating title and description...");

    // Step 2: Generate title and description based on transcription
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a professional financial advisor assistant. Based on the video transcription provided, generate a professional title and description suitable for client communications. 

The content should be:
- Professional and trustworthy
- Clear and concise
- Suitable for financial advisor-client communications
- Focus on key financial topics discussed

Respond with JSON in this exact format:
{
  "title": "Professional title (max 60 characters)",
  "description": "Brief description of key points covered (max 200 characters)"
}`
        },
        {
          role: "user",
          content: `Please analyze this financial advisor video transcription and generate a professional title and description:\n\n${transcription}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      text: transcription,
      title: result.title || "Financial Advisory Video",
      description: result.description || "Professional financial guidance and insights."
    };

  } catch (error) {
    console.error("OpenAI transcription/generation error:", error);
    
    // Return fallback content if OpenAI fails
    return {
      text: "Transcription unavailable",
      title: "Financial Advisory Video",
      description: "Professional financial guidance and insights."
    };
  }
}

/**
 * Generate captions/subtitles from transcription text
 * This creates WebVTT-format captions for HTML5 video
 */
export function generateCaptions(transcriptionText: string, videoDurationSeconds: number): string {
  if (!transcriptionText || transcriptionText === "Transcription unavailable") {
    return "";
  }

  // Simple caption generation - split text into segments
  const words = transcriptionText.split(' ');
  const wordsPerSegment = 8; // ~3 seconds of speech
  const segmentDuration = Math.max(3, videoDurationSeconds / Math.ceil(words.length / wordsPerSegment));
  
  let captions = "WEBVTT\n\n";
  let segmentNumber = 1;
  
  for (let i = 0; i < words.length; i += wordsPerSegment) {
    const segmentWords = words.slice(i, i + wordsPerSegment);
    const startTime = (segmentNumber - 1) * segmentDuration;
    const endTime = Math.min(segmentNumber * segmentDuration, videoDurationSeconds);
    
    // Format time as WebVTT timestamp (HH:MM:SS.mmm)
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const milliseconds = Math.floor((seconds % 1) * 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    };
    
    captions += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    captions += `${segmentWords.join(' ')}\n\n`;
    
    segmentNumber++;
  }
  
  return captions;
}

export default {
  transcribeAndGenerateContent,
  generateCaptions
};