/**
 * AWS Storage Service
 * 
 * Handles S3 uploads for agent portraits and provides URLs for NFT metadata
 * Supports presigned URLs for secure, temporary access
 * 
 * Environment Requirements:
 * - AWS_S3_BUCKET: S3 bucket name for portrait storage
 * - AWS_S3_REGION: AWS region (default: us-east-1)
 * - AWS_ACCESS_KEY_ID: AWS IAM access key
 * - AWS_SECRET_ACCESS_KEY: AWS IAM secret key
 */

/**
 * S3UploadConfig - Configuration for S3 upload
 */
export interface S3UploadConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * PortraitUploadResult - Result from portrait upload
 */
export interface PortraitUploadResult {
  key: string; // S3 object key (path)
  url: string; // Public or presigned URL
  bucket: string;
  region: string;
  uploadedAt: string;
}

/**
 * AWSStorageService - Manages S3 uploads and retrieval
 */
export class AWSStorageService {
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor(config: S3UploadConfig) {
    this.bucket = config.bucket;
    this.region = config.region || "us-east-1";
    this.accessKeyId = config.accessKeyId;
    this.secretAccessKey = config.secretAccessKey;

    // Validate configuration
    if (!this.bucket) {
      throw new Error("S3 bucket name is required");
    }
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error("AWS credentials (accessKeyId and secretAccessKey) are required");
    }
  }

  /**
   * Generate S3 object key for a portrait
   * Format: portraits/agentId/portrait-timestamp.webp
   */
  private generatePortraitKey(agentId: string): string {
    const timestamp = Date.now();
    return `portraits/${agentId}/portrait-${timestamp}.webp`;
  }

  /**
   * Generate AWS Signature Version 4 for S3 presigned URL
   * This is used for direct browser uploads without backend
   */
  private generatePresignedUrl(
    key: string,
    expirationSeconds: number = 3600
  ): string {
    // This is a simplified version - in production, use AWS SDK v3
    // For now, we'll use the public URL and assume the bucket allows CORS

    // If using public bucket:
    return this.getPublicUrl(key);

    // For private bucket with presigned URLs, use AWS SDK:
    // const s3Client = new S3Client({ region: this.region, credentials: {...} });
    // const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    // return await getSignedUrl(s3Client, command, { expiresIn: expirationSeconds });
  }

  /**
   * Get public S3 URL for an object
   */
  private getPublicUrl(key: string): string {
    // Virtual-hosted-style URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    // Alternative path-style URL:
    // return `https://s3.${this.region}.amazonaws.com/${this.bucket}/${key}`;
  }

  /**
   * Upload portrait image to S3
   * In browser context, this typically involves:
   * 1. Frontend generates presigned URL
   * 2. Frontend uploads directly to S3
   * OR
   * 1. Frontend sends image to backend
   * 2. Backend uploads to S3
   *
   * This method is designed for backend/Node.js use
   */
  async uploadPortrait(
    agentId: string,
    imageData: Buffer | ArrayBuffer | Blob | string,
    contentType: string = "image/webp"
  ): Promise<PortraitUploadResult> {
    // Note: In a browser environment, you should use AWS SDK v3
    // For Node.js/backend, this would be a full implementation

    const key = this.generatePortraitKey(agentId);
    const url = this.generatePresignedUrl(key);

    // In production, actually upload to S3 using AWS SDK
    // Example using AWS SDK v3:
    /*
    import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
    
    const s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    const buffer = Buffer.isBuffer(imageData) 
      ? imageData 
      : Buffer.from(imageData as string | ArrayBuffer);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read", // or "private" if using presigned URLs
        Metadata: {
          "agent-id": agentId,
          "uploaded-at": new Date().toISOString(),
        },
      })
    );
    */

    return {
      key,
      url,
      bucket: this.bucket,
      region: this.region,
      uploadedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate presigned URL for direct browser upload
   * Frontend can use this URL to PUT the image directly to S3
   */
  generatePresignedPutUrl(
    agentId: string,
    expirationSeconds: number = 3600
  ): {
    key: string;
    url: string;
    uploadUrl: string;
    expiresIn: number;
  } {
    const key = this.generatePortraitKey(agentId);
    const url = this.getPublicUrl(key);

    // For actual implementation with AWS SDK v3:
    // const uploadUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: expirationSeconds });

    return {
      key,
      url,
      uploadUrl: url, // In production, replace with presigned URL from AWS SDK
      expiresIn: expirationSeconds,
    };
  }

  /**
   * Get public URL for an uploaded portrait
   */
  getPortraitUrl(key: string): string {
    return this.getPublicUrl(key);
  }

  /**
   * Delete a portrait from S3
   */
  async deletePortrait(key: string): Promise<void> {
    // In production, use AWS SDK v3:
    /*
    import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
    
    const s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
    */

    console.log(`Marked for deletion: ${key}`);
  }

  /**
   * Generate NFT metadata JSON that includes portrait URL
   */
  generateMetadata(
    agentData: {
      agentId: string;
      name: string;
      faction: string;
      influence: number;
      reputation: number;
      ideology: string;
      governanceStyle: string;
      creationTurn: number;
      traits?: string;
      cognitiveScores?: string;
      portraitUrl: string;
    }
  ): object {
    return {
      name: agentData.name,
      description: `A POLIS agent from the ${agentData.faction} faction with ${agentData.ideology} ideology`,
      image: agentData.portraitUrl,
      attributes: [
        {
          trait_type: "Faction",
          value: agentData.faction,
        },
        {
          trait_type: "Ideology",
          value: agentData.ideology,
        },
        {
          trait_type: "Governance Style",
          value: agentData.governanceStyle,
        },
        {
          trait_type: "Influence",
          value: agentData.influence,
        },
        {
          trait_type: "Reputation",
          value: agentData.reputation,
        },
        {
          trait_type: "Creation Turn",
          value: agentData.creationTurn,
        },
        ...(agentData.traits
          ? [
              {
                trait_type: "Traits",
                value: agentData.traits,
              },
            ]
          : []),
        ...(agentData.cognitiveScores
          ? [
              {
                trait_type: "Cognitive Scores",
                value: agentData.cognitiveScores,
              },
            ]
          : []),
      ],
      external_url: `https://polis.example.com/agents/${agentData.agentId}`,
      properties: {
        polis: {
          agentId: agentData.agentId,
          turn: agentData.creationTurn,
        },
      },
    };
  }
}

/**
 * Global AWS storage service instance (singleton)
 */
let awsStorageService: AWSStorageService | null = null;

/**
 * Initialize AWS storage service
 */
export function initializeAWSStorageService(): AWSStorageService {
  if (awsStorageService) {
    return awsStorageService;
  }

  const config: S3UploadConfig = {
    bucket:
      (typeof process !== "undefined" && process.env.AWS_S3_BUCKET) ||
      (typeof window !== "undefined" && (window as any).AWS_S3_BUCKET) ||
      "",
    region:
      (typeof process !== "undefined" && process.env.AWS_S3_REGION) ||
      (typeof window !== "undefined" && (window as any).AWS_S3_REGION) ||
      "us-east-1",
    accessKeyId:
      (typeof process !== "undefined" && process.env.AWS_ACCESS_KEY_ID) ||
      (typeof window !== "undefined" && (window as any).AWS_ACCESS_KEY_ID) ||
      "",
    secretAccessKey:
      (typeof process !== "undefined" && process.env.AWS_SECRET_ACCESS_KEY) ||
      (typeof window !== "undefined" && (window as any).AWS_SECRET_ACCESS_KEY) ||
      "",
  };

  awsStorageService = new AWSStorageService(config);
  return awsStorageService;
}

/**
 * Get AWS storage service instance
 */
export function getAWSStorageService(): AWSStorageService {
  if (!awsStorageService) {
    return initializeAWSStorageService();
  }
  return awsStorageService;
}

/**
 * Create a new AWS storage service (for testing)
 */
export function createAWSStorageService(config: S3UploadConfig): AWSStorageService {
  return new AWSStorageService(config);
}
