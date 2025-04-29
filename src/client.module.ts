import { DynamicModule, Module } from '@nestjs/common'
import { ClientService } from './client.service'
import { HttpModule } from '@nestjs/axios'
import { ClientModuleAsyncOptions } from './interfaces/client-options.interface'

/**
 * @module ClientModule
 * @description
 * A dynamic NestJS module that provides client functionality for HSUITE applications.
 * This module manages client configuration, HTTP communication, and service integration.
 * 
 * Features:
 * - Dynamic module configuration via forRootAsync
 * - HTTP client integration with @nestjs/axios
 * - Global module scope for application-wide availability
 * - Flexible dependency injection support
 * - Asynchronous configuration options
 * 
 * @example
 * ```typescript
 * // Basic module registration with async configuration
 * @Module({
 *   imports: [
 *     ClientModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         baseUrl: configService.get('BASE_URL'),
 *         operator: {
 *           accountId: configService.get('OPERATOR_ID'),
 *           privateKey: configService.get('OPERATOR_KEY'),
 *           publicKey: configService.get('OPERATOR_PUBLIC_KEY')
 *         }
 *       }),
 *       inject: [ConfigService]
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class ClientModule {
  /**
   * Configures the ClientModule asynchronously with the provided options.
   * 
   * @description
   * This method enables dynamic configuration of the ClientModule using dependency injection
   * and async factories. It supports:
   * - Custom configuration providers
   * - Integration with ConfigService
   * - Dynamic operator settings
   * - HTTP client configuration
   * 
   * The configuration process:
   * 1. Imports required modules including HTTP
   * 2. Sets up client options provider
   * 3. Configures ClientService
   * 4. Makes module available globally
   * 
   * @param options - Module configuration options including imports, factory methods,
   *                 and injection tokens
   * @returns A promise resolving to the configured DynamicModule
   * 
   * @example
   * ```typescript
   * ClientModule.forRootAsync({
   *   imports: [ConfigModule],
   *   useFactory: async (config: ConfigService) => ({
   *     baseUrl: config.get('API_URL'),
   *     operator: {
   *       accountId: config.get('OPERATOR_ID'),
   *       privateKey: config.get('PRIVATE_KEY'),
   *       publicKey: config.get('PUBLIC_KEY')
   *     }
   *   }),
   *   inject: [ConfigService]
   * });
   * ```
   * 
   * @throws {Error} If required configuration options are missing
   */
  static async forRootAsync(options: ClientModuleAsyncOptions): Promise<DynamicModule> {
    return {
      module: ClientModule,
      imports: [
        ...options.imports,
        HttpModule.register({})
      ],
      providers: [
        {
          provide: 'clientOptions',
          useFactory: options.useFactory,
          inject: options.useExisting
        },
        ClientService
      ],
      exports: [
        ClientService
      ],
      global: true
    }
  }
}
