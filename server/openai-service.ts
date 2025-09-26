import OpenAI, { toFile } from "openai";

// Using GPT-4 for reliable and high-quality text generation
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
    // Create a proper file object for OpenAI using their helper
    console.log("Converting audio buffer to file object...");
    const audioFile = await toFile(audioBuffer, originalFilename || 'audio.mp4', { 
      type: 'audio/mp4' 
    });

    // Step 1: Transcribe audio using Whisper
    console.log("Starting audio transcription...");
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "text"
    });
    
    console.log(`Transcription completed. Length: ${transcription.length} characters`);

    console.log("Transcription completed, generating title and description...");

    // Step 2: Generate title and description based on transcription
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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
      max_completion_tokens: 300
    });

    let result;
    try {
      // Try to parse as JSON first in case the AI returns JSON anyway
      result = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      // If not JSON, parse the content manually
      const content = completion.choices[0].message.content || '';
      // Look for title and description patterns in the response
      const titleMatch = content.match(/title["\s]*:?\s*["\s]*([^"\n]{1,60})["\n]/i);
      const descMatch = content.match(/description["\s]*:?\s*["\s]*([^"\n]{1,200})["\n]/i);
      
      result = {
        title: titleMatch ? titleMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null
      };
    }
    
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
    console.log("No transcription available for caption generation");
    return "";
  }

  console.log(`Generating captions from transcription (${transcriptionText.length} chars) for ${videoDurationSeconds}s video`);

  // Improved caption generation - split text into segments with realistic timing
  const words = transcriptionText.split(' ').filter(word => word.trim());
  
  // More natural words per segment based on average speech rate
  // Average speech is 150 words per minute = 2.5 words per second
  const avgSecondsPerSegment = 3; // Show each caption for ~3 seconds
  const wordsPerSecond = 2.5;
  const wordsPerSegment = Math.round(avgSecondsPerSegment * wordsPerSecond); // About 7-8 words
  
  const totalSegments = Math.ceil(words.length / wordsPerSegment);
  
  // Calculate segment duration evenly across the video
  const segmentDuration = videoDurationSeconds / totalSegments;
  
  let captions = "WEBVTT\n\n";
  
  for (let i = 0; i < totalSegments; i++) {
    const segmentWords = words.slice(i * wordsPerSegment, (i + 1) * wordsPerSegment);
    if (segmentWords.length === 0) continue;
    
    const startTime = i * segmentDuration;
    const endTime = Math.min((i + 1) * segmentDuration, videoDurationSeconds);
    
    // Format time as WebVTT timestamp (HH:MM:SS.mmm)
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      // Use Math.round to avoid floating point precision issues
      const milliseconds = Math.round((seconds % 1) * 1000);
      // Ensure proper format with zero padding
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    };
    
    captions += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    captions += `${segmentWords.join(' ')}\n\n`;
  }
  
  console.log(`Generated ${totalSegments} caption segments`);
  
  return captions;
}

/**
 * Generate a professional 30-second script for explaining a finance chart
 */
export async function generateChartScript(chart: FinanceChart): Promise<ChartScriptResult> {
  try {
    console.log(`Generating script for chart: ${chart.title}`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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
      max_completion_tokens: 400
    });

    let result;
    try {
      // Try to parse as JSON first in case the AI returns JSON anyway
      result = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      // If not JSON, parse the content manually
      const content = completion.choices[0].message.content || '';
      // Extract script content (look for main body of text)
      const scriptMatch = content.match(/script["\s]*:?\s*["\s]*([^"]+)["\s]*[,}]/i) || 
                         content.match(/([^{}"]*?(?:chart|data|financial|insight|trend)[^}"]*)/i);
      
      result = {
        script: scriptMatch ? scriptMatch[1].trim() : null,
        estimatedDuration: 25,
        keyPoints: ["Key financial insights", "Important trends", "Investment implications"]
      };
    }
    
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