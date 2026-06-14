# POLIS Production Readiness Guide

## Overview

This guide covers the production-ready enhancements to POLIS including:
- OpenZeppelin standard compliance for NFT contracts
- Alchemy blockchain service integration
- AWS S3 portrait storage
- Agent Intelligence Engine for dynamic agent generation

## Smart Contract Upgrades

### PolisAgentNFT.sol Enhancements

#### New Features

1. **OpenZeppelin AccessControl**
   - Role-based permissions system
   - `ADMIN_ROLE`: Contract administration
   - `MINTER_ROLE`: NFT minting capability
   - `METADATA_UPDATER_ROLE`: Update agent data

2. **New Events**
   - `AgentMinted`: Emitted when agent NFT is created
   - `AgentUpdated`: Emitted when agent influence/faction/reputation changes
   - `AgentSnapshotStored`: Emitted when turn-based snapshot stored
   - `AgentMetadataUpdated`: Emitted when metadata URI changes

3. **Enhanced Agent Data**
   - Intelligence profile fields (traits, cognitive scores, governance tendency, portrait URL)
   - Reputation tracking (added reputationSnapshot)
   - Bidirectional mapping (token ID ↔ agent ID)

4. **New Functions**
   ```solidity
   // Read functions
   getAgentData(uint256 tokenId) → AgentNFTData
   getAgentOwner(uint256 tokenId) → address
   getTokenURI(uint256 tokenId) → string
   getTokenIdForAgent(string agentId) → uint256
   getAgentIdForToken(uint256 tokenId) → string
   getTotalAgentsMinted() → uint256

   // Write functions (role-protected)
   mintAgentNFT(address to, string agentId, AgentNFTData data) → uint256
   updateAgentSnapshot(uint256 tokenId, uint256 influence, uint256 reputation, string faction)
   storeAgentSnapshot(uint256 tokenId, uint256 turn, uint256 influence, uint256 reputation)
   updateMetadata(uint256 tokenId, string uri)
   updateAgentIntelligence(uint256 tokenId, string traits, string scores, string tendency, string portraitUrl)
   ```

#### Migration Checklist

- [ ] Deploy new contract to Arbitrum Sepolia
- [ ] Verify contract compiles with latest OpenZeppelin libraries
- [ ] Test all role-based access control
- [ ] Verify events emit correctly
- [ ] Run full test suite (see below)

#### Testing

```bash
# Run contract tests
npm run test

# Run specific test file
npx hardhat test test/PolisAgentNFT.test.ts

# Verify contract on Arbiscan
npx hardhat verify --network arbitrumSepolia DEPLOYED_ADDRESS "constructor_args"
```

---

## Blockchain Service Integration

### Alchemy Setup

1. **Create Alchemy Account**
   - Go to https://www.alchemy.com/
   - Sign up and create a free account
   - Create app for Arbitrum Sepolia network

2. **Get API Key**
   - Copy your API key from dashboard
   - Add to `.env.local`:
     ```
     ALCHEMY_API_KEY=your_api_key_here
     ```

3. **Benefits of Alchemy**
   - Higher rate limits than public RPC
   - Enhanced stability and uptime
   - Webhook support for blockchain events
   - Transaction tracking and debugging tools
   - Free tier suitable for production

### BlockchainService Usage

The `BlockchainService` class provides centralized contract interaction:

```typescript
import { getBlockchainService } from "@/lib/blockchain-service";

// Get singleton instance
const blockchainService = getBlockchainService("0x...contract_address");

// Connect wallet signer (for write operations)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
await blockchainService.connectSigner(signer);

// Read operations (no signer needed)
const agentData = await blockchainService.getAgentMetadata(tokenId);
const owner = await blockchainService.getAgentOwner(tokenId);
const totalMinted = await blockchainService.getTotalAgentsMinted();

// Write operations (requires signer)
const { tokenId, txHash, receipt } = await blockchainService.mintAgentNFT(
  userAddress,
  polisAgentId,
  agentNFTData
);

// Track transaction
const explorerUrl = blockchainService.getExplorerTxUrl(txHash);
```

### Environment Variables

```env
# Required
ALCHEMY_API_KEY=alchemy_key_here
VITE_POLIS_NFT_CONTRACT=0x...

# Optional (falls back to Alchemy if not set)
ARBITRUM_RPC_URL=https://...
```

---

## AWS S3 Integration

### S3 Bucket Setup

1. **Create S3 Bucket**
   - AWS Console → S3 → Create Bucket
   - Name: `polis-agent-portraits`
   - Region: `us-east-1` (or your preferred region)
   - Block public access: Keep enabled (use presigned URLs)

2. **CORS Configuration**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["https://polis.example.com"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Create IAM User**
   - IAM Dashboard → Users → Create User
   - Attach policy with minimal S3 permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::polis-agent-portraits/*"
       }
     ]
   }
   ```

4. **Generate Access Keys**
   - Copy Access Key ID and Secret Access Key
   - Add to `.env.local`:
   ```env
   AWS_S3_BUCKET=polis-agent-portraits
   AWS_S3_REGION=us-east-1
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   ```

### AWSStorageService Usage

```typescript
import { getAWSStorageService } from "@/lib/aws-storage-service";

const storageService = getAWSStorageService();

// Generate upload URL for frontend direct upload
const { uploadUrl, url, expiresIn } = storageService.generatePresignedPutUrl(
  agentId,
  3600 // 1 hour expiration
);

// Frontend can now PUT image directly to S3
await fetch(uploadUrl, {
  method: "PUT",
  body: imageBlob,
  headers: { "Content-Type": "image/webp" }
});

// Generate metadata with portrait URL
const metadata = storageService.generateMetadata({
  agentId,
  name: agent.name,
  faction: agent.faction,
  portraitUrl: url,
  // ... other fields
});
```

### Benefits

- Serverless storage reduces backend load
- Global CDN distribution via S3
- Presigned URLs provide secure temporary access
- Metadata stored on-chain references S3 URLs
- Cost-effective at scale

---

## Agent Intelligence Engine

### Overview

The Agent Intelligence Engine generates unique agent profiles based on user selections during agent creation. Every field directly influences the political simulation.

### Input Parameters

```typescript
interface AgentCreationInputs {
  leadershipStyle: "Authoritarian" | "Democratic" | "Pragmatic" | "Visionary";
  governancePhilosophy: "Centralized" | "Decentralized" | "Hybrid" | "Technocratic";
  riskTolerance: "Conservative" | "Balanced" | "Aggressive" | "Radical";
  communicationStyle: "Persuasive" | "Analytical" | "Collaborative" | "Commanding";
  strategicFocus: "Economic" | "Social" | "Military" | "Diplomatic" | "Cultural";
  ethicalAlignment: "Pragmatic" | "Idealistic" | "Neutral" | "Individualistic";
  politicalTemperament: "Cooperative" | "Competitive" | "Neutral" | "Radical";
}
```

### Generated Profile Components

#### 1. Personality Traits (affects proposal reactions & voting)
```
- Pragmatic (0-100)
- Idealistic (0-100)
- Opportunistic (0-100)
- Authoritarian (0-100)
- Cooperative (0-100)
- Visionary (0-100)
- Conservative (0-100)
- Expansionist (0-100)
```

Traits directly influence:
- Proposal acceptance/rejection likelihood
- Voting alignment with faction
- Proposal generation preferences
- Coalition formation behavior

#### 2. Cognitive Scores (influences voting power & success)
```
- Diplomacy: 0-100
- Strategy: 0-100
- Governance: 0-100
- Influence: 0-100
- Negotiation: 0-100
- Stability Preference: 0-100
```

Usage:
- Higher diplomacy → more likely to form coalitions
- Higher strategy → support complex/ambitious proposals
- Higher governance → support institutional reforms
- Stability preference → resist radical changes

#### 3. Faction Compatibility (recommends starting faction)
```
Technocrats: 84%
Reformists: 62%
Sovereigns: 31%
...
```

- Highest scored faction is recommended
- Used for initial faction assignment
- Can influence proposal reception by faction

#### 4. Behavior Profile (natural language)
```
"This agent tends to support reform policies, prefers 
coalition-building, and is likely to oppose authoritarian 
governance."
```

Used for:
- UI display of agent character
- Proposal narrative generation
- Event descriptions

#### 5. Governance Tendency (role prediction)
```
One of:
- Consensus Builder
- Coalition Broker
- Political Radical
- Institutional Defender
- Strategic Opportunist
- Diplomatic Mediator
- Reform Advocate
```

Affects:
- How agent approaches governance challenges
- Proposal generation strategy
- Alliance preferences
- Crisis response

#### 6. Projected Political Role
```
One of:
- Field Strategist
- Diplomat
- Legislator
- Reformer
- Power Broker
- Coalition Architect
- Ideological Champion
- Consensus Seeker
```

Used for:
- UI role display
- Social dynamics
- Alliance formation bonuses

#### 7. Ideology Anchor (persistent voting guide)
```
{
  primaryIdeology: "Progressive" | "Conservative" | "Centrist" | etc.,
  ideologyStrength: 0-100,
  ideologyVector: -100 (leftist) to +100 (rightist)
}
```

Affects:
- Voting on ideological proposals
- Alliance formation across factions
- Proposal generation preferences
- Ideology drift calculations

#### 8. Growth Potential (initial stats & trajectory)
```
{
  projectedInfluence: 0-100,
  projectedReputation: 0-100,
  growthRate: -0.5 to +0.5 per turn
}
```

Used for:
- Initial influence/reputation assignment
- Long-term power trajectory prediction
- Victory condition scoring

### Usage Example

```typescript
import { AgentIntelligenceEngine, formatIntelligenceProfile } from "@/lib/agent-intelligence-engine";

// User creates agent with selected inputs
const inputs: AgentCreationInputs = {
  leadershipStyle: "Democratic",
  governancePhilosophy: "Decentralized",
  riskTolerance: "Balanced",
  communicationStyle: "Collaborative",
  strategicFocus: "Social",
  ethicalAlignment: "Idealistic",
  politicalTemperament: "Cooperative"
};

// Generate complete profile
const profile = AgentIntelligenceEngine.generateProfile(inputs);

// Format for display
const formatted = formatIntelligenceProfile(profile);

// Store in agent
agent.personalityTraits = profile.personalityTraits;
agent.cognitiveScores = profile.cognitiveScores;
agent.faction = profile.recommendedFaction;
agent.ideology = profile.ideologyAnchor.primaryIdeology;
agent.governanceTendency = profile.governanceTendency;
agent.traits = JSON.stringify(profile.personalityTraits);

// Include in NFT metadata
const nftData: AgentNFTData = {
  agentName: agent.name,
  traits: JSON.stringify(profile.personalityTraits),
  cognitiveScores: JSON.stringify(profile.cognitiveScores),
  governanceTendency: profile.governanceTendency,
  portraitUrl: portraitS3Url,
  // ... other fields
};
```

### Integration with POLIS Systems

#### Proposal Engine
- Use agent traits to weight proposal generation
- Ideological agents generate ideological proposals
- Pragmatic agents generate practical proposals

#### Voting Engine
- Use cognitive scores to calculate voting weight
- Use traits to determine voting alignment
- Use ideology anchor to influence vote on ideological proposals

#### Influence Engine
- Use growth potential for initial influence
- Use diplomacy/negotiation for coalition bonuses
- Use governance tendency for alliance formation

#### Faction System
- Use faction compatibility for faction dynamics
- Consider cognitive scores in faction voting

#### Feed System
- Describe agent as per behavioral profile
- Generate event narratives using role and ideology

---

## Complete Agent Creation Flow

```
User Input (7 fields)
       ↓
AgentIntelligenceEngine.generateProfile()
       ↓
[Personality Traits, Cognitive Scores, Faction Compatibility, 
 Behavior Profile, Governance Tendency, Political Role, 
 Ideology Anchor, Growth Potential]
       ↓
Generate AI Portrait → AWS S3 Upload
       ↓
AWSStorageService.generateMetadata(portraitUrl)
       ↓
Generate NFT Metadata JSON
       ↓
BlockchainService.mintAgentNFT(metadata)
       ↓
Transaction on Arbitrum Sepolia
       ↓
Store Intelligence Profile in POLIS Store
       ↓
Integration with Political Simulation
```

---

## Environment Variable Checklist

- [ ] `ALCHEMY_API_KEY` - Set for blockchain access
- [ ] `VITE_POLIS_NFT_CONTRACT` - Contract address on Arbitrum Sepolia
- [ ] `AWS_S3_BUCKET` - S3 bucket name for portraits
- [ ] `AWS_S3_REGION` - AWS region (default: us-east-1)
- [ ] `AWS_ACCESS_KEY_ID` - IAM user access key
- [ ] `AWS_SECRET_ACCESS_KEY` - IAM user secret key
- [ ] `.env.local` created from `.env.example`
- [ ] `.env.local` added to `.gitignore`

---

## Deployment Checklist

### Contract Deployment
- [ ] Run contract tests: `npm run test`
- [ ] Deploy to Arbitrum Sepolia
- [ ] Verify on Arbiscan
- [ ] Grant MINTER_ROLE and METADATA_UPDATER_ROLE to backend/frontend
- [ ] Update `VITE_POLIS_NFT_CONTRACT` in environment

### Infrastructure
- [ ] Alchemy app created and API key secured
- [ ] AWS S3 bucket created with proper CORS
- [ ] IAM user created with minimal S3 permissions
- [ ] AWS credentials stored securely in environment

### Frontend Integration
- [ ] Blockchain service connected to contract
- [ ] AWS storage service uploading portraits
- [ ] Agent Intelligence Engine generating profiles
- [ ] NFT minting UI updated to use new flow
- [ ] Full end-to-end test: Create agent → Mint NFT → Verify on-chain

### Testing
- [ ] Unit tests for intelligence engine
- [ ] Integration tests for blockchain service
- [ ] Integration tests for AWS storage
- [ ] End-to-end agent creation test
- [ ] Load testing with multiple concurrent mints

---

## Troubleshooting

### Contract Deployment Issues

**Error: "Missing MINTER_ROLE"**
- Ensure backend/frontend has MINTER_ROLE granted: 
  ```solidity
  contract.grantRole(MINTER_ROLE, backendAddress);
  ```

### Blockchain Service Issues

**Error: "RPC endpoint failed"**
- Verify Alchemy API key is correct
- Check network is Arbitrum Sepolia (421614)
- Ensure rate limits not exceeded

**Error: "Signer not connected"**
- Must call `connectSigner()` before write operations
- User must have MetaMask connected

### AWS Storage Issues

**Error: "CORS policy violation"**
- Verify S3 CORS configuration
- Check allowed origins match frontend URL
- Ensure bucket permissions are correct

**Error: "Access Denied"**
- Verify IAM user has S3 permissions
- Check Access Key ID and Secret are correct
- Ensure bucket name matches config

---

## Performance Optimization

1. **Caching**
   - Cache contract ABIs locally
   - Cache agent profiles in localStorage
   - Use React Query for RPC caching

2. **Batch Operations**
   - Batch multiple mint operations
   - Use multicall for multiple reads

3. **Image Optimization**
   - Generate WebP format (smaller file size)
   - Resize images to 512x512 before S3 upload
   - Use S3 CloudFront distribution

4. **RPC Optimization**
   - Use Alchemy's enhanced RPC methods
   - Enable automatic transaction retry
   - Use webhook for transaction monitoring

---

## Security Considerations

1. **Private Keys**
   - Never commit `.env` files
   - Use `.gitignore` to prevent accidental commits
   - Rotate keys regularly in production

2. **Smart Contract**
   - Only MINTER_ROLE can mint NFTs
   - Only METADATA_UPDATER_ROLE can update data
   - Consider timelock for admin functions

3. **S3 Access**
   - Use presigned URLs instead of public bucket
   - Implement bucket versioning for recovery
   - Enable access logging for audit

4. **Frontend**
   - Validate user inputs before blockchain submission
   - Never expose private keys
   - Use content security policy headers

---

## Monitoring & Maintenance

### Metrics to Track
- NFT mint success rate
- Transaction gas costs
- API response times (Alchemy)
- S3 upload success rate
- Agent creation time

### Regular Maintenance
- Monitor Alchemy usage vs rate limits
- Review S3 costs
- Backup agent intelligence profiles
- Keep dependencies updated
- Monitor contract events

---

## Support & Resources

- **Alchemy Docs**: https://docs.alchemy.com/
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **Arbitrum Docs**: https://docs.arbitrum.io/
- **ethers.js**: https://docs.ethers.org/v6/

---

## Changelog

### v2.0.0 - Production Readiness Release
- ✅ OpenZeppelin AccessControl integration
- ✅ Alchemy RPC endpoint support
- ✅ AWS S3 portrait storage
- ✅ Agent Intelligence Engine
- ✅ Comprehensive role-based access control
- ✅ Enhanced event logging
- ✅ Full NatSpec documentation
