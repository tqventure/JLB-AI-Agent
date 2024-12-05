import { Tool } from "langchain/tools";
import { SolanaAgentKit } from "../index";
import { PublicKey } from "@solana/web3.js";
import { PumpFunTokenOptions } from "../types";
import { toJSON } from "../utils/toJSON";
export class SolanaBalanceTool extends Tool {
  name = "solana_balance";
  description =
    "Get the balance of a Solana wallet or token account. Input can be a token address or empty for SOL balance.";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const tokenAddress = input ? new PublicKey(input) : undefined;
      const balance = await this.solanaKit.getBalance(tokenAddress);
      return `Balance: ${balance}`;
    } catch (error: any) {
      return `Error getting balance: ${error.message}`;
    }
  }
}

export class SolanaTransferTool extends Tool {
  name = "solana_transfer";
  description =
    "Transfer tokens or SOL to another address. Input should be JSON string with: {to: string, amount: number, mint?: string}";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { to, amount, mint } = JSON.parse(input);
      const recipient = new PublicKey(to);
      const mintAddress = mint ? new PublicKey(mint) : undefined;

      await this.solanaKit.transfer(recipient, amount, mintAddress);
      return `Successfully transferred ${amount} to ${to}`;
    } catch (error: any) {
      return `Error making transfer: ${error.message}`;
    }
  }
}

export class SolanaDeployTokenTool extends Tool {
  name = "solana_deploy_token";
  description =
    "Deploy a new SPL token. Input should be JSON string with: {decimals?: number, initialSupply?: number}";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const validJson = input
        .replace(/([a-zA-Z0-9_]+):/g, '"$1":') // Add quotes around keys
        .trim();
      const { decimals = 9 } = JSON.parse(validJson);
      const result = await this.solanaKit.deployToken(decimals);
      return `Token deployed successfully. Mint address: ${result.mint.toString()}`;
    } catch (error: any) {
      return `Error deploying token: ${error.message}`;
    }
  }
}

export class SolanaDeployCollectionTool extends Tool {
  name = "solana_deploy_collection";
  description =
    "Deploy a new NFT collection. Input should be JSON with: {name: string, uri: string, royaltyBasisPoints?: number, creators?: Array<{address: string, percentage: number}>}";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const options = JSON.parse(input);
      const result = await this.solanaKit.deployCollection(options);
      return `Collection deployed successfully. Address: ${result.collectionAddress.toString()}`;
    } catch (error: any) {
      return `Error deploying collection: ${error.message}`;
    }
  }
}

export class SolanaMintNFTTool extends Tool {
  name = "solana_mint_nft";
  description =
    "Mint a new NFT in a collection. Input should be JSON with: {collectionMint: string, metadata: {name: string, symbol: string, uri: string}, recipient?: string}";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { collectionMint, metadata, recipient } = JSON.parse(input);
      const recipientPubkey = recipient ? new PublicKey(recipient) : undefined;
      const result = await this.solanaKit.mintNFT(
        new PublicKey(collectionMint),
        metadata,
        recipientPubkey
      );
      return `NFT minted successfully. Mint address: ${result.mint.toString()}`;
    } catch (error: any) {
      return `Error minting NFT: ${error.message}`;
    }
  }
}

export class SolanaTradeTool extends Tool {
  name = "solana_trade";
  description =
    "Swap tokens using Jupiter Exchange. Input should be JSON with: {outputMint: string, inputAmount: number, inputMint?: string, slippageBps?: number}";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { outputMint, inputAmount, inputMint, slippageBps } =
        JSON.parse(input);
      const tx = await this.solanaKit.trade(
        new PublicKey(outputMint),
        inputAmount,
        inputMint ? new PublicKey(inputMint) : undefined,
        slippageBps
      );
      return `Trade executed successfully. Transaction: ${tx}`;
    } catch (error: any) {
      return `Error executing trade: ${error.message}`;
    }
  }
}

export class SolanaRequestFundsTool extends Tool {
  name = "solana_request_funds";
  description = "Request SOL from Solana faucet (devnet/testnet only)";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    try {
      await this.solanaKit.requestFaucetFunds();
      return "Successfully requested faucet funds";
    } catch (error: any) {
      return `Error requesting funds: ${error.message}`;
    }
  }
}

export class SolanaRegisterDomainTool extends Tool {
  name = "solana_register_domain";
  description =
    "Register a .sol domain name. Input should be JSON with: {name: string, spaceKB?: number}";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const { name, spaceKB = 1 } = JSON.parse(input);
      const tx = await this.solanaKit.registerDomain(name, spaceKB);
      return `Domain registered successfully. Transaction: ${tx}`;
    } catch (error: any) {
      return `Error registering domain: ${error.message}`;
    }
  }
}

export class SolanaGetWalletAddressTool extends Tool {
  name = "solana_get_wallet_address";
  description = "Get the wallet address of the agent";

  constructor(private solanaKit: SolanaAgentKit) {
    super();
  }

  async _call(_input: string): Promise<string> {
    return this.solanaKit.wallet_address.toString();
  }
}

export class SolanaPumpfunTokenLaunchTool extends Tool {
  name = "solana_launch_pumpfun_token";
  description = "Launch a new token on Pump.fun via Solana Agent Kit. Requires a JSON input with tokenName and tokenTicker, with optional fields for description, twitter, telegram, website, imageUrl, initialLiquiditySOL, and mintAddress.";

  constructor(private solanaKit: SolanaAgentKit) {
      super();
  }

  private validateInput(input : any): void {
      if (!input.tokenName || typeof input.tokenName !== 'string') {
          throw new Error('tokenName is required and must be a string');
      }
      if (!input.tokenTicker || typeof input.tokenTicker !== 'string') {
          throw new Error('tokenTicker is required and must be a string');
      }
      if (input.initialLiquiditySOL !== undefined && typeof input.initialLiquiditySOL !== 'number') {
          throw new Error('initialLiquiditySOL must be a number when provided');
      }
  }

  protected async _call(input: string): Promise<string> {
      try {
          // Parse and normalize input
          const parsedInput = toJSON(input);
          // Validate the input
          this.validateInput(parsedInput);

          // Launch token with validated input
          await this.solanaKit.launchPumpFunToken(
              parsedInput.tokenName,
              parsedInput.tokenTicker,
              {
                  description: parsedInput.description,
                  twitter: parsedInput.twitter,
                  telegram: parsedInput.telegram,
                  website: parsedInput.website,
                  imageUrl: parsedInput.imageUrl,
                  initialLiquiditySOL: parsedInput.initialLiquiditySOL,
              }
          );

          return JSON.stringify({
              status: "success",
              message: "Token launched successfully on Pump.fun",
              tokenName: parsedInput.tokenName,
              tokenTicker: parsedInput.tokenTicker
          });

      } catch (error: any) {
          return JSON.stringify({
              status: "error",
              message: error.message,
              code: error.code || "UNKNOWN_ERROR"
          });
      }
  }
}

export function createSolanaTools(solanaKit: SolanaAgentKit) {
  return [
    new SolanaBalanceTool(solanaKit),
    new SolanaTransferTool(solanaKit),
    new SolanaDeployTokenTool(solanaKit),
    new SolanaDeployCollectionTool(solanaKit),
    new SolanaMintNFTTool(solanaKit),
    new SolanaTradeTool(solanaKit),
    new SolanaRequestFundsTool(solanaKit),
    new SolanaRegisterDomainTool(solanaKit),
    new SolanaGetWalletAddressTool(solanaKit),
    new SolanaPumpfunTokenLaunchTool(solanaKit),
  ];
}
