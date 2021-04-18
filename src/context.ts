import { Config } from './config';

/**
 * Internal context object used to pass around config and config-derived
 * constants.
 */
export type Context = Config & {
    SPLIT_DIFFS: boolean;
    LINE_WIDTH: number;
    BLANK_LINE: string;
    HORIZONTAL_SEPARATOR: string;
};
