'use strict';

/**
 * A module dealing with browser {@link Blob}s and {@link Worker}s.
 *
 * @module rodosha/workers
 */
Esquire.define('rodosha/workers', ['$global/Worker', '$global/Blob', '$global/BlobBuilder', '$global/URL'], function(Worker, Blob, BlobBuilder, URL) {

  /* Sanity check */
  if (! Worker) throw new Error("Worker API not supported");
  if (! Blob) throw new Error("Blobs API not supported");
  if ((! URL) || (! URL.createObjectURL)) throw new Error("Object URLs not supported");

  /**
   * Create a new {@link Blob} instance from a `string` or an array.
   *
   * @function makeBlob
   * @param {string|string[]} content The content of the {@link Blob} to create.
   * @param {string} [contentType] The MIME type for the {@link Blob} to create,
   *                               defaults to `application/javascript`.
   * @returns Blob A newly created `Blob` instance.
   */
  function makeBlob(content, contentType) {
    if (! Array.isArray(content)) content = [ content ];
    if (! contentType) contentType = "application/javascript";
    try {
      /* Try normal construction */
      return new Blob(content, { type: contentType });

    } catch (error) {

      /* Ouch! Use the builder? :-) */
      if (! BlobBuilder) throw error;

      /* Instrument the builder */
      var builder = new BlobBuilder();
      for (var i in content) {
        builder.append(content[i]);
      }

      /* Create the blob */
      return builder.getBlob('application/javascript');
    }
  }

  /**
   * Create a `string` __URL__ for the specified {@link Blob} (or content).
   *
   * @function makeURL
   * @param {string|string[]|Blob} content Either the {@link Blob} whose URL
   *                                       needs to be created, or some content
   *                                       which will be wrapped into a new
   *                                       {@link Blob} instance.
   * @param {string} [contentType] The MIME type for the {@link Blob} to create,
   *                               defaults to `application/javascript`.
   * @returns string The URL for the {@link Blob}
   */
  function makeURL(content, contentType) {
    if (content instanceof Blob) {
      return URL.createObjectURL(content, contentType);
    } else {
      return URL.createObjectURL(makeBlob(content));
    }
  }

  /**
   * Create a {@link Worker} for the specified {@link Blob}, URL or content.
   *
   * @function makeWorker
   * @param {string|string[]|Blob} content Either the {@link Worker}'s script
   *                                       {@link Blob}, or its content, or a
   *                                       string starting with `blob:` which
   *                                       will be interpreted as a URL.
   * @param {string} [contentType] The MIME type for the {@link Blob} to create,
   *                               defaults to `application/javascript`.
   * @returns Worker The {@link Worker} associated with the script.
   */
  function makeWorker(content, contentType) {
    if ((typeof(content) === 'string') && content.match(/^blob:/)) {
      return new Worker(content);
    } else {
      return new Worker(makeURL(content, contentType));
    }
  }

  return Object.freeze({
    makeWorker: makeWorker,
    makeBlob: makeBlob,
    makeURL:  makeURL
  });

});
