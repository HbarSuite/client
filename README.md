# @hsuite/client

A comprehensive NestJS module providing client functionality for HSUITE applications, with built-in support for Web3 authentication, node communication, and network resilience.

## Features

- 🔐 Web3-based authentication flow
- 🌐 Dynamic node connection management
- 🔄 Automatic network resilience and failover
- 🍪 Session management with cookie support
- ⚡ HTTP client with axios integration
- 🛡️ Secure cryptographic signing
- 📡 Periodic health monitoring
- 🔌 Flexible module configuration
- 🎯 Global module scope support

## Installation

```bash
npm install @hsuite/client
```

### Peer Dependencies

This module requires the following peer dependencies:

```json
{
  "@nestjs/common": "^10.4.2",
  "@nestjs/core": "^10.4.2"
}
```

## Quick Start

1. Import the module in your `app.module.ts`:

```typescript
import { ClientModule } from '@hsuite/client';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseUrl: configService.get('BASE_URL'),
        operator: {
          accountId: configService.get('OPERATOR_ID'),
          privateKey: configService.get('OPERATOR_KEY'),
          publicKey: configService.get('OPERATOR_PUBLIC_KEY')
        }
      }),
      inject: [ConfigService]
    })
  ]
})
export class AppModule {}
```

2. Inject and use the ClientService in your components:

```typescript
@Injectable()
class YourService {
  constructor(private clientService: ClientService) {}

  async yourMethod() {
    // Access authenticated client
    const loginInfo = this.clientService.login;
    
    // Make authenticated requests
    const response = await this.clientService.axios.get('/your-endpoint');
  }
}
```

## API Reference

### ClientModule

The main module that provides client functionality.

#### Methods

- `forRootAsync(options: ClientModuleAsyncOptions)`: Configures the module asynchronously with dependency injection support.

### ClientService

Core service for managing client operations and authentication.

#### Properties

- `login`: Get current Web3 login credentials
- `operator`: Get current operator information
- `axios`: Get configured axios instance for making HTTP requests

#### Methods

- `onModuleInit()`: Initializes client connection and authentication
- Private methods handle node connection, network resilience, and data signing

### Configuration Options

The module supports three configuration patterns:

1. Factory Function Pattern:
```typescript
ClientModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    baseUrl: config.get('API_URL'),
    operator: {
      accountId: config.get('OPERATOR_ID'),
      privateKey: config.get('OPERATOR_KEY'),
      publicKey: config.get('OPERATOR_PUBLIC_KEY')
    }
  }),
  inject: [ConfigService]
});
```

2. Existing Provider Pattern:
```typescript
ClientModule.forRootAsync({
  useExisting: [ExistingConfigService]
});
```

3. Class Provider Pattern:
```typescript
ClientModule.forRootAsync({
  useClass: CustomClientOptionsFactory
});
```

## Features in Detail

### Web3 Authentication Flow

The module implements a complete Web3 authentication flow:
1. Requests authentication challenge
2. Signs challenge with operator credentials
3. Submits signed proof for verification
4. Establishes authenticated session
5. Sets up periodic health monitoring

### Network Resilience

Built-in support for handling network issues:
- Automatic failover to alternative nodes
- Connection error handling (ECONNREFUSED, ECONNABORTED, ECONNRESET)
- Dynamic node selection
- Session maintenance during node failures

### Security Features

- Cryptographic signing of requests
- Secure cookie handling
- Private key management
- Session-based authentication

## Documentation

Detailed documentation can be generated using Compodoc:

```bash
npm run compodoc
```

To check documentation coverage:

```bash
npm run compodoc:coverage
```

## Dependencies

Core dependencies:
- `@hsuite/smart-network-types`: "2.0.0"
- `@hsuite/auth-types`: "2.0.0"
- `@hsuite/nestjs-swagger`: "1.0.3"
- `@hsuite/smart-config`: "2.0.0"

Development dependencies:
- `@compodoc/compodoc`: "^1.1.23"

## Version

Current version: 2.0.0

## License

This package is part of the HSuite Enterprise solution.

---

<p align="center">
  Built with ❤️ by the HbarSuite Team<br>
  Copyright © 2024 HbarSuite. All rights reserved.
</p>