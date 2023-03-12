export = uzip;
declare namespace uzip {
  function finflate(
    input: Uint8Array,
    output: Uint8Array | null | undefined,
    dict: Uint8Array | null | undefined
  ): Uint8Array;
}
