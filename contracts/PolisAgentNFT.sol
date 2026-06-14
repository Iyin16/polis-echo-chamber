// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PolisAgentNFT
 * @author POLIS
 * @notice ERC-721 contract for minting POLIS agents as sovereign on-chain identities.
 * 
 * Each agent NFT represents a persistent identity snapshot with:
 * - Agent name, ideology, and faction
 * - Influence and reputation metrics
 * - Political traits and cognitive scores
 * - Generated intelligence profile
 * - Portal to on-chain governance participation
 * 
 * @dev Implements role-based access control:
 * - DEFAULT_ADMIN_ROLE: Full contract administration
 * - MINTER_ROLE: Can mint new agent NFTs
 * - METADATA_UPDATER_ROLE: Can update agent metadata
 */

contract PolisAgentNFT is ERC721, ERC721URIStorage, ERC721Burnable, Ownable, AccessControl {
    using Counters for Counters.Counter;

    // Role definitions for access control
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant METADATA_UPDATER_ROLE = keccak256("METADATA_UPDATER_ROLE");

    Counters.Counter private _tokenIdCounter;

    /// @dev Comprehensive agent NFT data including intelligence profile
    struct AgentNFTData {
        string agentName;
        string ideology;
        string faction;
        uint256 influenceSnapshot;
        uint256 reputationSnapshot;
        uint256 createdTurn;
        string metadataURI;
        // Intelligence engine data (JSON encoded in metadata)
        string traits;
        string cognitiveScores;
        string governanceTendency;
        string portraitUrl;
    }

    /// @dev Maps token ID to agent data
    mapping(uint256 => AgentNFTData) public agentData;
    
    /// @dev Maps POLIS agent ID to token ID for quick lookup
    mapping(string => uint256) public agentIdToTokenId;
    
    /// @dev Maps token ID to agent's off-chain POLIS agent ID
    mapping(uint256 => string) public tokenIdToAgentId;

    // ========== Events ==========

    /// @notice Emitted when a new agent NFT is minted
    /// @param tokenId The unique token ID of the minted NFT
    /// @param owner The address that owns the NFT
    /// @param agentName The name of the agent
    /// @param faction The faction the agent belongs to
    /// @param influenceSnapshot The influence value at mint time
    event AgentMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string agentName,
        string faction,
        uint256 influenceSnapshot
    );

    /// @notice Emitted when agent data is updated
    /// @param tokenId The token ID of the updated agent
    /// @param newInfluence Updated influence score
    /// @param newReputation Updated reputation score
    /// @param newFaction Updated faction alignment
    event AgentUpdated(
        uint256 indexed tokenId,
        uint256 newInfluence,
        uint256 newReputation,
        string newFaction
    );

    /// @notice Emitted when an agent snapshot is stored (turn update)
    /// @param tokenId The token ID of the agent
    /// @param turn The turn number when snapshot was taken
    /// @param influenceSnapshot The influence value in snapshot
    /// @param reputationSnapshot The reputation value in snapshot
    event AgentSnapshotStored(
        uint256 indexed tokenId,
        uint256 turn,
        uint256 influenceSnapshot,
        uint256 reputationSnapshot
    );

    /// @notice Emitted when agent metadata is updated on-chain
    /// @param tokenId The token ID of the agent
    /// @param metadataURI The new metadata URI
    event AgentMetadataUpdated(
        uint256 indexed tokenId,
        string metadataURI
    );

    // ========== Constructor ==========

    /// @dev Initialize contract with name and symbol, set up roles
    constructor() ERC721("PolisAgentNFT", "POLIS") {
        // Grant admin role to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(METADATA_UPDATER_ROLE, msg.sender);
    }

    // ========== Minting Functions ==========

    // ========== Minting Functions ==========

    /// @notice Mint a new agent NFT with complete intelligence profile
    /// @dev Only addresses with MINTER_ROLE can call this function
    /// @param to Address to mint the NFT to
    /// @param polisAgentId Off-chain POLIS agent ID for tracking
    /// @param data Comprehensive agent data including intelligence profile
    /// @return tokenId The newly minted token ID
    function mintAgentNFT(
        address to,
        string memory polisAgentId,
        AgentNFTData memory data
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(bytes(data.agentName).length > 0, "Agent name required");
        require(bytes(data.faction).length > 0, "Faction required");
        require(to != address(0), "Invalid recipient");
        require(bytes(polisAgentId).length > 0, "Agent ID required");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, data.metadataURI);

        agentData[tokenId] = data;
        agentIdToTokenId[polisAgentId] = tokenId;
        tokenIdToAgentId[tokenId] = polisAgentId;

        emit AgentMinted(
            tokenId,
            to,
            data.agentName,
            data.faction,
            data.influenceSnapshot
        );

        return tokenId;
    }

    // ========== Query Functions ==========

    /// @notice Get complete agent data for a token ID
    /// @param tokenId The token ID to query
    /// @return AgentNFTData struct with all agent information
    function getAgentData(uint256 tokenId)
        public
        view
        returns (AgentNFTData memory)
    {
        require(_exists(tokenId), "Token does not exist");
        return agentData[tokenId];
    }

    /// @notice Get token ID for a POLIS agent
    /// @param polisAgentId The off-chain POLIS agent ID
    /// @return The token ID, or 0 if not found
    function getTokenIdForAgent(string memory polisAgentId)
        public
        view
        returns (uint256)
    {
        return agentIdToTokenId[polisAgentId];
    }

    /// @notice Get POLIS agent ID for a token ID
    /// @param tokenId The token ID to query
    /// @return The POLIS agent ID
    function getAgentIdForToken(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        require(_exists(tokenId), "Token does not exist");
        return tokenIdToAgentId[tokenId];
    }

    /// @notice Get owner of an agent
    /// @param tokenId The token ID to query
    /// @return The address that owns the agent NFT
    function getAgentOwner(uint256 tokenId)
        public
        view
        returns (address)
    {
        return ownerOf(tokenId);
    }

    /// @notice Get metadata URI for an agent
    /// @param tokenId The token ID to query
    /// @return The metadata URI
    function getTokenURI(uint256 tokenId)
        public
        view
        returns (string memory)
    {
        return tokenURI(tokenId);
    }

    /// @notice Get total number of agents minted
    /// @return The count of minted agents
    function totalAgentsMinted() public view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // ========== Update Functions ==========

    /// @notice Update agent influence and faction snapshot (for governance outcomes)
    /// @dev Only addresses with METADATA_UPDATER_ROLE can call this
    /// @param tokenId The token ID of the agent to update
    /// @param newInfluence Updated influence score
    /// @param newReputation Updated reputation score
    /// @param newFaction Updated faction alignment
    function updateAgentSnapshot(
        uint256 tokenId,
        uint256 newInfluence,
        uint256 newReputation,
        string memory newFaction
    ) public onlyRole(METADATA_UPDATER_ROLE) {
        require(_exists(tokenId), "Token does not exist");
        require(bytes(newFaction).length > 0, "Faction required");

        agentData[tokenId].influenceSnapshot = newInfluence;
        agentData[tokenId].reputationSnapshot = newReputation;
        agentData[tokenId].faction = newFaction;

        emit AgentUpdated(tokenId, newInfluence, newReputation, newFaction);
    }

    /// @notice Store an agent snapshot at a specific turn (archive update)
    /// @dev Only addresses with METADATA_UPDATER_ROLE can call this
    /// @param tokenId The token ID of the agent
    /// @param turn The turn number of the snapshot
    /// @param influenceSnapshot Influence value at this turn
    /// @param reputationSnapshot Reputation value at this turn
    function storeAgentSnapshot(
        uint256 tokenId,
        uint256 turn,
        uint256 influenceSnapshot,
        uint256 reputationSnapshot
    ) public onlyRole(METADATA_UPDATER_ROLE) {
        require(_exists(tokenId), "Token does not exist");

        // Update current snapshot
        agentData[tokenId].influenceSnapshot = influenceSnapshot;
        agentData[tokenId].reputationSnapshot = reputationSnapshot;
        agentData[tokenId].createdTurn = turn;

        emit AgentSnapshotStored(tokenId, turn, influenceSnapshot, reputationSnapshot);
    }

    /// @notice Update agent metadata URI
    /// @dev Only addresses with METADATA_UPDATER_ROLE can call this
    /// @param tokenId The token ID to update
    /// @param newMetadataURI The new metadata URI (typically IPFS or HTTPS)
    function updateMetadata(uint256 tokenId, string memory newMetadataURI)
        public
        onlyRole(METADATA_UPDATER_ROLE)
    {
        require(_exists(tokenId), "Token does not exist");
        require(bytes(newMetadataURI).length > 0, "Metadata URI required");

        agentData[tokenId].metadataURI = newMetadataURI;
        _setTokenURI(tokenId, newMetadataURI);

        emit AgentMetadataUpdated(tokenId, newMetadataURI);
    }

    /// @notice Update agent intelligence profile data
    /// @dev Only addresses with METADATA_UPDATER_ROLE can call this
    /// @param tokenId The token ID to update
    /// @param traits JSON-encoded trait data
    /// @param cognitiveScores JSON-encoded cognitive scores
    /// @param governanceTendency Natural language governance prediction
    /// @param portraitUrl URL to agent portrait (S3, IPFS, etc.)
    function updateAgentIntelligence(
        uint256 tokenId,
        string memory traits,
        string memory cognitiveScores,
        string memory governanceTendency,
        string memory portraitUrl
    ) public onlyRole(METADATA_UPDATER_ROLE) {
        require(_exists(tokenId), "Token does not exist");

        agentData[tokenId].traits = traits;
        agentData[tokenId].cognitiveScores = cognitiveScores;
        agentData[tokenId].governanceTendency = governanceTendency;
        agentData[tokenId].portraitUrl = portraitUrl;
    }

    // ========== ERC721 Standard Overrides ==========

    /// @dev Required override for ERC721Burnable
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /// @dev Required override for ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @dev Required override for AccessControl interface detection
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Check if token exists (helper)
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
