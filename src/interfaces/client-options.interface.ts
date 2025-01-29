import { ModuleMetadata, Type } from '@nestjs/common/interfaces';
import { IClient } from '@hsuite/client-types';

/**
 * @interface ClientModuleAsyncOptions
 * @description
 * Configuration interface for asynchronous initialization of the ClientModule.
 * Extends NestJS ModuleMetadata to provide flexible options for module setup.
 * 
 * This interface supports three primary configuration patterns:
 * 1. Factory Function Pattern - Using useFactory
 * 2. Existing Provider Pattern - Using useExisting
 * 3. Class Provider Pattern - Using useClass
 * 
 * Key Features:
 * - Asynchronous configuration support
 * - Dependency injection integration
 * - Flexible provider options
 * - Module imports management
 * 
 * @example
 * ```typescript
 * // Using Factory Function Pattern
 * ClientModule.forRootAsync({
 *   imports: [ConfigModule],
 *   useFactory: (config: ConfigService) => ({
 *     baseUrl: config.get('API_URL'),
 *     operator: {
 *       accountId: config.get('OPERATOR_ID'),
 *       privateKey: config.get('OPERATOR_KEY'),
 *       publicKey: config.get('OPERATOR_PUBLIC_KEY')
 *     }
 *   }),
 *   inject: [ConfigService]
 * });
 * 
 * // Using Existing Provider Pattern
 * ClientModule.forRootAsync({
 *   useExisting: [ExistingConfigService]
 * });
 * 
 * // Using Class Provider Pattern
 * ClientModule.forRootAsync({
 *   useClass: CustomClientOptionsFactory
 * });
 * ```
 */
export interface ClientModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
    /**
     * Existing provider configuration option.
     * 
     * @description
     * Specifies an array of existing providers that implement the ClientOptionsFactory interface.
     * These providers must be available in the current module context.
     * 
     * Use this when you have existing services that can provide client configuration.
     * 
     * @example
     * ```typescript
     * {
     *   useExisting: [ExistingConfigService]
     * }
     * ```
     */
    useExisting?: Array<Type<any>>;

    /**
     * Class-based provider configuration option.
     * 
     * @description
     * Specifies a class that will be instantiated to create the client options.
     * The class must implement the ClientOptionsFactory interface.
     * 
     * Use this when you want to encapsulate configuration logic in a dedicated class.
     * 
     * @example
     * ```typescript
     * {
     *   useClass: CustomClientOptionsFactory
     * }
     * ```
     */
    useClass?: Type<any>;

    /**
     * Factory function configuration option.
     * 
     * @description
     * A factory function that returns client configuration options.
     * Can be synchronous or asynchronous (Promise-based).
     * 
     * Use this for dynamic configuration based on injected dependencies.
     * 
     * @param args - Dependencies injected into the factory function
     * @returns Client options object or Promise resolving to client options
     * 
     * @example
     * ```typescript
     * {
     *   useFactory: async (config: ConfigService) => ({
     *     baseUrl: await config.getAsync('API_URL'),
     *     operator: {
     *       accountId: config.get('OPERATOR_ID')
     *     }
     *   }),
     *   inject: [ConfigService]
     * }
     * ```
     */
    useFactory?: (...args: any[]) => Promise<IClient.IOptions> | IClient.IOptions;

    /**
     * Dependency injection tokens.
     * 
     * @description
     * Array of providers to be injected into the factory function.
     * These tokens correspond to the parameters of the factory function.
     * 
     * Use this to specify dependencies required by the factory function.
     * 
     * @example
     * ```typescript
     * {
     *   useFactory: (config: ConfigService, http: HttpService) => ({ ... }),
     *   inject: [ConfigService, HttpService]
     * }
     * ```
     */
    inject?: any[];
}