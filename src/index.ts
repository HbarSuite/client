/**
 * @module Client
 * @description
 * Main entry point for the HSUITE client module that provides comprehensive client functionality.
 * This module exports all essential components for client operations including:
 * - Client module configuration and setup
 * - Client service for node interactions
 * - Type definitions and interfaces
 * 
 * @packageDocumentation
 */

/**
 * Re-exports the client module for module configuration and dependency injection
 * @see ClientModule For module configuration options and setup
 */
export * from './client.module'

/**
 * Re-exports the client service for node interaction and authentication
 * @see ClientService For client operations and node communication
 */
export * from './client.service'

/**
 * Re-exports client configuration interfaces and types
 * @see IClientOptions For client configuration options
 */
export * from './interfaces/client-options.interface'