/**
 * Standard HTTP methods
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  CONNECT = 'CONNECT',
  OPTIONS = 'OPTIONS',
  TRACE = 'TRACE',
  PATCH = 'PATCH'
}

/** Informational (1xx) responses */
export enum Informational {
  CONTINUE = 100,
  SWITCHING_PROTOCOLS = 101,
  PROCESSING = 102,
  EARLY_HINTS = 103,
  UPLOAD_RESUMPTION_SUPPORTED = 104 // IANA-registered Nov 2024 :contentReference[oaicite:7]{index=7}
}

/** Successful (2xx) responses */
export enum Success {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NON_AUTHORITATIVE_INFORMATION = 203,
  NO_CONTENT = 204,
  RESET_CONTENT = 205,
  PARTIAL_CONTENT = 206,
  MULTI_STATUS = 207,
  ALREADY_REPORTED = 208,
  THIS_IS_FINE = 218, // Apache // Non-standard // Just some fun for short dev life
  IM_USED = 226
}

/** Redirection (3xx) responses */
export enum Redirection {
  MULTIPLE_CHOICES = 300,
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  USE_PROXY = 305, // Deprecated
  SWITCH_PROXY = 306, // Unused / reserved :contentReference[oaicite:8]{index=8}
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308
}

/** Client Error (4xx) responses */
export enum ClientError {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  PAYMENT_REQUIRED = 402,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  PROXY_AUTHENTICATION_REQUIRED = 407,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  GONE = 410,
  LENGTH_REQUIRED = 411,
  PRECONDITION_FAILED = 412,
  CONTENT_TOO_LARGE = 413, // Renamed (RFC9110)
  URI_TOO_LONG = 414,
  UNSUPPORTED_MEDIA_TYPE = 415,
  RANGE_NOT_SATISFIABLE = 416,
  EXPECTATION_FAILED = 417,
  IM_A_TEAPOT = 418, // Just some fun for short dev life
  ENHANCE_YOUR_CALM = 420, // Twitter // Non-standard // Just some fun for short dev life
  MISDIRECTED_REQUEST = 421,
  UNPROCESSABLE_CONTENT = 422,
  LOCKED = 423,
  FAILED_DEPENDENCY = 424,
  TOO_EARLY = 425,
  UPGRADE_REQUIRED = 426,
  PRECONDITION_REQUIRED = 428,
  TOO_MANY_REQUESTS = 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE = 431,
  UNAVAILABLE_FOR_LEGAL_REASONS = 451
}

/** Server Error (5xx) responses */
export enum ServerError {
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
  HTTP_VERSION_NOT_SUPPORTED = 505,
  VARIANT_ALSO_NEGOTIATES = 506,
  INSUFFICIENT_STORAGE = 507,
  LOOP_DETECTED = 508,
  NOT_EXTENDED = 510, // Obsolete (historic) :contentReference[oaicite:9]{index=9}
  NETWORK_AUTHENTICATION_REQUIRED = 511
}

// Combined status codes object for easy access.
export const StatusCodes = {
  ...Informational,
  ...Success,
  ...Redirection,
  ...ClientError,
  ...ServerError
};

// Combined map for lookup
const statusTextMap: Record<number, string> = {
  // 1xx
  [Informational.CONTINUE]: 'Continue',
  [Informational.SWITCHING_PROTOCOLS]: 'Switching Protocols',
  [Informational.PROCESSING]: 'Processing',
  [Informational.EARLY_HINTS]: 'Early Hints',
  [Informational.UPLOAD_RESUMPTION_SUPPORTED]: 'Upload Resumption Supported',

  // 2xx
  [Success.OK]: 'OK',
  [Success.CREATED]: 'Created',
  [Success.ACCEPTED]: 'Accepted',
  [Success.NON_AUTHORITATIVE_INFORMATION]: 'Non-Authoritative Information',
  [Success.NO_CONTENT]: 'No Content',
  [Success.RESET_CONTENT]: 'Reset Content',
  [Success.PARTIAL_CONTENT]: 'Partial Content',
  [Success.MULTI_STATUS]: 'Multi-Status',
  [Success.ALREADY_REPORTED]: 'Already Reported',
  [Success.THIS_IS_FINE]: 'This Is Fine',
  [Success.IM_USED]: 'IM Used',

  // 3xx
  [Redirection.MULTIPLE_CHOICES]: 'Multiple Choices',
  [Redirection.MOVED_PERMANENTLY]: 'Moved Permanently',
  [Redirection.FOUND]: 'Found',
  [Redirection.SEE_OTHER]: 'See Other',
  [Redirection.NOT_MODIFIED]: 'Not Modified',
  [Redirection.USE_PROXY]: 'Use Proxy',
  [Redirection.SWITCH_PROXY]: 'Switch Proxy (Unused)',
  [Redirection.TEMPORARY_REDIRECT]: 'Temporary Redirect',
  [Redirection.PERMANENT_REDIRECT]: 'Permanent Redirect',

  // 4xx
  [ClientError.BAD_REQUEST]: 'Bad Request',
  [ClientError.UNAUTHORIZED]: 'Unauthorized',
  [ClientError.PAYMENT_REQUIRED]: 'Payment Required',
  [ClientError.FORBIDDEN]: 'Forbidden',
  [ClientError.NOT_FOUND]: 'Not Found',
  [ClientError.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [ClientError.NOT_ACCEPTABLE]: 'Not Acceptable',
  [ClientError.PROXY_AUTHENTICATION_REQUIRED]: 'Proxy Authentication Required',
  [ClientError.REQUEST_TIMEOUT]: 'Request Timeout',
  [ClientError.CONFLICT]: 'Conflict',
  [ClientError.GONE]: 'Gone',
  [ClientError.LENGTH_REQUIRED]: 'Length Required',
  [ClientError.PRECONDITION_FAILED]: 'Precondition Failed',
  [ClientError.CONTENT_TOO_LARGE]: 'Content Too Large',
  [ClientError.URI_TOO_LONG]: 'URI Too Long',
  [ClientError.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
  [ClientError.RANGE_NOT_SATISFIABLE]: 'Range Not Satisfiable',
  [ClientError.EXPECTATION_FAILED]: 'Expectation Failed',
  [ClientError.IM_A_TEAPOT]: "I'm a Teapot",
  [ClientError.ENHANCE_YOUR_CALM]: 'Enhance Your Calm',
  [ClientError.MISDIRECTED_REQUEST]: 'Misdirected Request',
  [ClientError.UNPROCESSABLE_CONTENT]: 'Unprocessable Content',
  [ClientError.LOCKED]: 'Locked',
  [ClientError.FAILED_DEPENDENCY]: 'Failed Dependency',
  [ClientError.TOO_EARLY]: 'Too Early',
  [ClientError.UPGRADE_REQUIRED]: 'Upgrade Required',
  [ClientError.PRECONDITION_REQUIRED]: 'Precondition Required',
  [ClientError.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [ClientError.REQUEST_HEADER_FIELDS_TOO_LARGE]:
    'Request Header Fields Too Large',
  [ClientError.UNAVAILABLE_FOR_LEGAL_REASONS]: 'Unavailable For Legal Reasons',

  // 5xx
  [ServerError.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
  [ServerError.NOT_IMPLEMENTED]: 'Not Implemented',
  [ServerError.BAD_GATEWAY]: 'Bad Gateway',
  [ServerError.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [ServerError.GATEWAY_TIMEOUT]: 'Gateway Timeout',
  [ServerError.HTTP_VERSION_NOT_SUPPORTED]: 'HTTP Version Not Supported',
  [ServerError.VARIANT_ALSO_NEGOTIATES]: 'Variant Also Negotiates',
  [ServerError.INSUFFICIENT_STORAGE]: 'Insufficient Storage',
  [ServerError.LOOP_DETECTED]: 'Loop Detected',
  [ServerError.NOT_EXTENDED]: 'Not Extended (Obsolete)',
  [ServerError.NETWORK_AUTHENTICATION_REQUIRED]:
    'Network Authentication Required'
};

/**
 * Lookup a reason phrase by status code.
 * @param code number or numeric string
 */
export function httpStatusTextByCode(code: number | string): string {
  const num = typeof code === 'string' ? parseInt(code, 10) : code;
  const text = statusTextMap[num];
  if (!text) {
    console.log(
      `${'\x1b[1m'}${'\x1b[31m'}⚠️  Unknown HTTP status code: ${code}${'\x1b[0m'}`
    );
    return 'Unknown Status';
  }
  return text;
}
