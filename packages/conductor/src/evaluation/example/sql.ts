export interface TextToSQLService {
    processQuestion(question: string, context: any): Promise<{
      query: string;
      explanation: string;
      confidence: number;
    }>;
  }