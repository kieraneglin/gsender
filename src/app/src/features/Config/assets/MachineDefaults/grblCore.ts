import { ATCI_SUPPORTED_VERSION } from 'app/features/ATC/utils/ATCiConstants.ts';
import { EEPROM } from 'app/definitions/firmware';

export interface GrblCoreMigration {
    cutoffSemver: number;
    keyRemaps: Record<EEPROM, EEPROM>;
    valueOverrides: Record<EEPROM, string | null>;
}

// remap key->key
// remap key-> new value
// remap key -> null = removed in core
export const GRBLCORE_MIGRATION: GrblCoreMigration = {
    cutoffSemver: ATCI_SUPPORTED_VERSION,
    keyRemaps: {
        $450: '$590',
        $451: '$591',
        $452: '$592',
        $453: '$490',
        $454: '$491',
        $455: '$492',
        $743: '$716',
        $456: '$750',
        $457: '$751',
        $458: '$752',
        $459: '$753',
        $664: '$536',
        $665: '$537',
    },
    valueOverrides: {
        $535: '02:08:dc:cf:7b:8d',
        $668: null,
    },
};
