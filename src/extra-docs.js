/** @typedef {module:slaves.Slave} Slave */

/* ========================================================================== */

/**
 * @protected
 * @class Promise
 * @classdesc The {@link Promise} interface is used for deferred and
 * asynchronous computations.
 */

/**
 * Appends fulfillment and rejection handlers to this {@link Promise}, and
 * returns a **new** promise resolving to the return value of the called
 * handler.
 *
 * @param {function} [onSuccess] - The handler to call when this
 *        {@link Promise} has been successfully resolved.
 * @param {function} [onFailure] - The handler to call when this
 *        {@link Promise} has been rejected.
 * @returns {Promise} A new {@link Promise} resolving to the return value
 *          of the called handler
 * @instance
 * @function Promise#then
 */

/**
 * Appends a rejection handler to this {@link Promise}, and returns a
 * **new** promise resolving to the return value of the called handler.
 *
 * This is equivalent to calling `then(null, onFailure)`.
 *
 * @param {function} [onFailure] - The handler to call when this
 *        {@link Promise} has been rejected.
 * @returns {Promise} A new {@link Promise} resolving to the return value
 *          of the called handler
 * @instance
 * @function Promise#catch
 */

/**
 * @protected
 * @class Worker
 * @classdesc The {@link Worker} interface represents a background task (it
 * spawns real OS-level threads) that can be easily created and can send
 * messages back to their creators.
 */

/**
 * An event listener that is called whenever an error bubbles through the
 * {@link Worker}.
 *
 * @member Worker#onerror
 * @type function
 */

/**
 * An event listener that is called whenever a message bubbles through the
 * {@link Worker}. The message is stored in the event's `data` property.
 * {@link Worker}.
 *
 * @member Worker#onerror
 * @type function
 */

/**
 * Sends a message, that is any JavaScript object to the worker's inner scope.
 *
 * @function Worker#postMessage
 * @param {*} message - The message to send to the worker.
 */

/**
 *
 * Immediately terminates the worker. This does not offer the worker an
 * opportunity to finish its operations; it is simply stopped at once.
 *
 * @function Worker#terminate
 */
