import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import * as axiosCookieJarSupport from 'axios-cookiejar-support'
import { ISmartNetwork } from '@hsuite/smart-network-types'
import { Auth, IAuth } from '@hsuite/auth-types'
import { PrivateKey } from '@hashgraph/sdk'
import { HttpService } from '@nestjs/axios'
import { SmartConfigService } from '@hsuite/smart-config'
import { IClient } from '@hsuite/client-types'

/**
 * @service ClientService
 * @description
 * Core service for managing client operations, authentication, and node communication
 * in the HSUITE ecosystem. This service handles:
 * 
 * Core Features:
 * - Web3-based authentication flow
 * - Node connection management
 * - Network resilience with automatic failover
 * - Session management with cookie support
 * - Periodic health checks
 * 
 * Security Features:
 * - Cryptographic signing of requests
 * - Secure cookie handling
 * - Private key management
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class YourService {
 *   constructor(private clientService: ClientService) {}
 * 
 *   async yourMethod() {
 *     // Access authenticated client
 *     const loginInfo = this.clientService.login;
 *     
 *     // Make authenticated requests
 *     const response = await this.clientService.axios.get('/your-endpoint');
 *   }
 * }
 * ```
 */
@Injectable()
export class ClientService implements OnModuleInit {
    /** Internal logger instance for service operations */
    private logger: Logger = new Logger(ClientService.name);
    
    /** Stores the authenticated Web3 login response */
    private _login: Auth.Credentials.Web3.Response.Login;
    
    /** Current operator entity containing node and authentication details */
    private _operator: ISmartNetwork.IOperator.IEntity;

    /**
     * Initializes the ClientService with required dependencies.
     * 
     * @description
     * Sets up the service with:
     * - HTTP client configuration
     * - Cookie jar support for session management
     * - Cross-origin credentials handling
     * - Operator configuration
     * 
     * @param clientOptions - Configuration for client behavior and authentication
     * @param httpService - HTTP client for making requests
     * @param smartConfigService - Service for network configuration
     */
    constructor(
        @Inject('clientOptions') private clientOptions: IClient.IOptions,
        private httpService: HttpService,
        private smartConfigService: SmartConfigService
    ) {
        // Set up cookie jar support for maintaining session
        const tough = require('tough-cookie');
        axiosCookieJarSupport.wrapper(this.httpService.axiosRef);
        const cookieJar = new tough.CookieJar();

        this.httpService.axiosRef.defaults.jar = cookieJar;
        this.httpService.axiosRef.defaults.withCredentials = true;
    }

    /**
     * Retrieves the current Web3 login credentials.
     * 
     * @description
     * Provides access to the authenticated session information including:
     * - Authentication tokens
     * - Session metadata
     * - User credentials
     * 
     * @returns The current Web3 login response or undefined if not authenticated
     */
    get login(): Auth.Credentials.Web3.Response.Login {
        return this._login;
    }

    /**
     * Retrieves the current operator information.
     * 
     * @description
     * Provides access to the active node operator details including:
     * - Account information
     * - Node URL
     * - Network metadata
     * 
     * @returns The current operator entity or undefined if not connected
     */
    get operator(): ISmartNetwork.IOperator.IEntity {
        return this._operator;
    }

    /**
     * Generates a base URL for client operations.
     * 
     * @description
     * Implements smart node selection by:
     * 1. Fetching available nodes from the network
     * 2. Randomly selecting an operational node
     * 3. Storing operator information for the selected node
     * 
     * This method supports network resilience by enabling
     * dynamic node selection and failover capabilities.
     * 
     * @returns Promise resolving to the selected node's base URL
     * @throws {Error} If no valid nodes are available
     */
    private async generateBaseUrl(): Promise<string> {
        let network: Array<ISmartNetwork.INetwork.IEntity> = await this.smartConfigService.getNodes();
        let randomNode = Math.floor(Math.random() * (network.length - 1));
        this._operator = (network[randomNode]).membership.operator;
        return this._operator.url;
    }

    /**
     * Initializes the client connection on module startup.
     * 
     * @description
     * Performs the following initialization steps:
     * 1. Sets up the base URL (configured or generated)
     * 2. Establishes initial node connection
     * 3. Performs Web3 authentication
     * 4. Sets up connection monitoring
     * 
     * @throws {Error} If connection or authentication fails
     */
    async onModuleInit() {
        try {
            if(this.clientOptions.baseUrl) {
                this.httpService.axiosRef.defaults.baseURL = this.clientOptions.baseUrl;
            } else {
                this.httpService.axiosRef.defaults.baseURL = await this.generateBaseUrl();
            }

            if(this.httpService.axiosRef.defaults.baseURL.startsWith('http')) {
                this.logger.verbose(`trying to connect with ${this.httpService.axiosRef.defaults.baseURL}...`);
                this._login = await this.connectToNode();
                this.logger.verbose(`connected to node: ${this.httpService.axiosRef.defaults.baseURL}`);
            }
        } catch (error) {
            this.logger.error(
                `failed to connect to node: ${this.httpService.axiosRef.defaults.baseURL}: ${error.code}`
            );
        }
    }

    /**
     * Handles network resilience and failover scenarios.
     * 
     * @description
     * Implements automatic recovery from network issues:
     * - Handles specific connection errors (ECONNREFUSED, ECONNABORTED, ECONNRESET)
     * - Attempts to find alternative nodes
     * - Maintains service availability during node failures
     * 
     * @param error - The network error triggering resilience handling
     * @throws {Error} If the error cannot be handled through resilience mechanisms
     */
    private async networkResilience(error: any) {
        if(['ECONNREFUSED','ECONNABORTED','ECONNRESET'].includes(error.code)) {
            this.httpService.axiosRef.defaults.baseURL = await this.generateBaseUrl();
        } else {
            throw error;
        }
    }

    /**
     * Establishes authenticated connection to a network node.
     * 
     * @description
     * Implements the complete Web3 authentication flow:
     * 1. Requests authentication challenge
     * 2. Signs the challenge with operator credentials
     * 3. Submits signed proof for verification
     * 4. Establishes authenticated session
     * 5. Sets up periodic health monitoring
     * 
     * @returns Promise resolving to the login response
     * @throws {Error} If authentication fails or network is unreachable
     */
    private async connectToNode(): Promise<IAuth.ICredentials.IWeb3.IResponse.ILogin> {
        return new Promise(async (resolve, reject) => {
            try {
                let authRequest = await this.httpService.axiosRef.get('/auth/web3/request');

                let payload: IAuth.ICredentials.IWeb3.IRequest.ISignin.ISignedPayload = {
                    serverSignature: authRequest.data.signedData.signature,
                    originalPayload: authRequest.data.payload
                };

                let signedData: IAuth.ICredentials.IWeb3.IRequest.ISignin.ILogin = this.signNodeData(payload);

                let loginRequest: IAuth.ICredentials.IWeb3.IResponse.ILogin = (await this.httpService.axiosRef.post(
                    '/auth/web3/login',
                    signedData
                )).data;

                let interval = setInterval(async () => {
                    try {
                        let profile = await this.httpService.axiosRef.get('/auth/profile');
                        console.log(profile.data);
                    } catch (error) {
                        clearInterval(interval);
                        await this.connectToNode();
                    }
                }, 60000 * 60 * 24);

                resolve(loginRequest);
            } catch (error) {
                if(this.clientOptions.baseUrl) {
                    reject(error);
                } else {
                    try {
                        await this.networkResilience(error);
                        resolve(await this.connectToNode());
                    } catch(error) {
                        reject(error);
                    }
                }
            }
        });
    }

    /**
     * Provides access to the configured axios instance.
     * 
     * @description
     * Returns the HTTP client instance configured with:
     * - Base URL
     * - Authentication headers
     * - Cookie handling
     * - Retry logic
     * 
     * @returns The configured axios instance for making HTTP requests
     */
    get axios() {
        return this.httpService.axiosRef;
    }

    /**
     * Signs node authentication data with operator credentials.
     * 
     * @description
     * Performs cryptographic signing of authentication data:
     * 1. Uses operator's private key for signing
     * 2. Formats the authentication payload
     * 3. Generates cryptographic proof
     * 4. Prepares the complete login request
     * 
     * @param payload - The authentication payload to sign
     * @returns Signed login request with operator information
     * @throws {Error} If signing fails or operator credentials are invalid
     */
    private signNodeData(payload: IAuth.ICredentials.IWeb3.IRequest.ISignin.ISignedPayload): 
    IAuth.ICredentials.IWeb3.IRequest.ISignin.ILogin {
        const privateKey = PrivateKey.fromString(this.clientOptions.operator.privateKey);
        let bytes = new Uint8Array(Buffer.from(JSON.stringify(payload)));
        let signature = privateKey.sign(bytes);

        return {
            signedData: {
                signedPayload: payload,
                userSignature: signature,
            },
            operator: {
                accountId: this.clientOptions.operator.accountId,
                publicKey: this.clientOptions.operator.publicKey.toString(),
                url: this.clientOptions.operator.url,
                nft: {
                    id: null,
                    serialNumber: null
                }
            }
        };
    }
}
