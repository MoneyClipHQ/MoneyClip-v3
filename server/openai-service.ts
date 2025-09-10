import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
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

export interface ChartScriptResult {
  script: string;
  estimatedDuration: number;
  keyPoints: string[];
}

export interface FinanceChart {
  id: string;
  title: string;
  category: string;
  chartType: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
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
      model: "gpt-5",
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

  // Improved caption generation - split text into segments with realistic timing
  const words = transcriptionText.split(' ');
  const wordsPerSegment = 6; // ~2-3 seconds of speech (more natural)
  const totalSegments = Math.ceil(words.length / wordsPerSegment);
  
  // Calculate more realistic segment duration (aim for 2-4 seconds per segment)
  const segmentDuration = Math.min(4, Math.max(2, videoDurationSeconds / totalSegments));
  
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

/**
 * Generate a professional 30-second script for explaining a finance chart
 */
export async function generateChartScript(chart: FinanceChart): Promise<ChartScriptResult> {
  try {
    console.log(`Generating script for chart: ${chart.title}`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a professional financial advisor creating scripts for client video explanations. Generate a clear, professional script that can be read aloud in 30 seconds or less.

The script should:
- Be conversational and engaging
- Explain the chart data in simple terms
- Highlight key insights and trends
- Be suitable for financial advisor-client communications
- Focus on actionable insights
- Be exactly 30 seconds or shorter when read aloud (approximately 75-90 words)

Respond with JSON in this exact format:
{
  "script": "Complete script text to be read aloud",
  "estimatedDuration": number (in seconds, max 30),
  "keyPoints": ["key point 1", "key point 2", "key point 3"]
}`
        },
        {
          role: "user",
          content: `Generate a 30-second script for this finance chart:

Title: ${chart.title}
Category: ${chart.category}
Chart Type: ${chart.chartType}
Description: ${chart.description}

Data Summary: ${JSON.stringify(chart.data.slice(0, 5))}... (showing first 5 data points)

Create a professional script that explains the key insights from this chart data.`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 400
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      script: result.script || "This chart shows important financial data that can help guide your investment decisions.",
      estimatedDuration: Math.min(30, result.estimatedDuration || 25),
      keyPoints: result.keyPoints || ["Key financial insights", "Important trends", "Investment implications"]
    };

  } catch (error) {
    console.error("OpenAI chart script generation error:", error);
    
    // Return fallback script if OpenAI fails
    return {
      script: `Looking at this ${chart.title.toLowerCase()}, we can see important trends in the ${chart.category.toLowerCase()} data. The chart reveals key insights that can help inform your financial decisions. Let me walk you through the most significant patterns and what they mean for your portfolio.`,
      estimatedDuration: 25,
      keyPoints: ["Important trends identified", "Key financial insights", "Portfolio implications"]
    };
  }
}

export default {
  transcribeAndGenerateContent,
  generateCaptions,
  generateChartScript
};