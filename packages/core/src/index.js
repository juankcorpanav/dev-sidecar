/**
 * dev-sidecar core module
 * Provides proxy and acceleration services for developer tools
 */

'use strict'

const path = require('path')
const log = require('./utils/logger')

/**
 * Core DevSidecar class
 * Manages proxy server lifecycle and configuration
 */
class DevSidecar {
  constructor () {
    this.status = 'stopped'
    this.config = null
    this.servers = {}
  }

  /**
   * Initialize the sidecar with configuration
   * @param {object} config - Configuration object
   */
  async init (config) {
    this.config = config || require('./config/default')
    log.info('DevSidecar initializing...')
    log.info(`Config loaded: ${JSON.stringify(this.config, null, 2)}`)
    return this
  }

  /**
   * Start all configured proxy servers
   */
  async start () {
    if (this.status === 'running') {
      log.warn('DevSidecar is already running')
      return
    }

    try {
      log.info('Starting DevSidecar...')
      this.status = 'starting'

      // Start proxy server
      await this._startProxy()

      this.status = 'running'
      log.info('DevSidecar started successfully')
    } catch (err) {
      this.status = 'error'
      log.error('Failed to start DevSidecar:', err)
      throw err
    }
  }

  /**
   * Stop all running servers
   */
  async stop () {
    if (this.status === 'stopped') {
      log.warn('DevSidecar is already stopped')
      return
    }

    try {
      log.info('Stopping DevSidecar...')
      this.status = 'stopping'

      for (const [name, server] of Object.entries(this.servers)) {
        if (server && typeof server.close === 'function') {
          await server.close()
          log.info(`Server '${name}' stopped`)
        }
      }

      this.servers = {}
      this.status = 'stopped'
      log.info('DevSidecar stopped')
    } catch (err) {
      log.error('Error stopping DevSidecar:', err)
      throw err
    }
  }

  /**
   * Get current status
   * @returns {string} Current status
   */
  getStatus () {
    return this.status
  }

  /**
   * Internal: Start the proxy server
   * @private
   */
  async _startProxy () {
    const ProxyServer = require('./proxy/server')
    const proxyConfig = this.config.proxy || {}
    const server = new ProxyServer(proxyConfig)
    await server.start()
    this.servers.proxy = server
    log.info(`Proxy server started on port ${proxyConfig.port || 1181}`)
  }
}

// Export singleton instance factory
module.exports = {
  DevSidecar,
  /**
   * Create and return a new DevSidecar instance
   * @param {object} config - Optional configuration
   * @returns {DevSidecar}
   */
  create (config) {
    return new DevSidecar().init(config)
  }
}
