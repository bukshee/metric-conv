'use strict'

type UnitFormula = (val: number) => number
type UnitMap = [string, string, number|UnitFormula]
type ValUnitPair = [number, string]

const mapper:UnitMap[] = [

    // distance
    ['foot|ft|feet' , 'm', 0.3048],
    ['inch|in'      , 'm', 0.0254],
    ['yard|yd'      , 'm', 0.9144],
    ['mile|mi'      , 'm', 1609.344],

    // mass
    ['ton|tn'       , 'g', 907184.7],
    ['pound|lb'     , 'g', 453.5924],
    ['ounce|oz'     , 'g', 28.349526],
    ['carat|ct'     , 'g', 0.2],

    // volume
    ['gallon (UK)'  , 'l', 4.546090],
    ['gallon|gal'   , 'l', 3.7854118],
    ['pint|pt'      , 'l', 0.473176475],
    ['bushel (UK)'  , 'l', 36.36872],
    ['bushel|bsh|bu', 'l', 35.239072],
    ['teaspoon|tsp' , 'l', 35.239072],
    ['cu-in|cu in|cuin'  , 'l', 0.016387064],
    ['cu-ft|cu ft|cuft'  , 'l', 28.31685],
    ['fl-oz|fl oz'  , 'l', 0.029573529],

    // area
    ['acre'         , 'm2', 4046.85642],
    ['sq-in|sqin|sq in', 'm2', 0.00064516],
    ['sq-ft|sqft|sq ft', 'm2', 0.09290304],
    ['sq-mi|sq mi|square mile', 'm2', 2589988],
    ['ha'           , 'm2', 10000],

    // speed
    ['knot|kt|kn'   , 'm/s', 0.5144447],
    ['km/h|kph|kmph', 'm/s', 0.27777777],
    ['mph'          , 'm/s', 2.23693629205],
    
    // power, torque
    ['hp'           , 'W',  735.49875],
    ['bhp'          , 'W', 745.699872],

    // misc
    ['lb-ft|pound feet| pound foot', 'Nm', 1.3558179483314],
    ['°F|fahrenheit|f|degf', '°C', (val:number) => { return (val-32)*5/9 }],
    ['K|kelvin|degk','°C', (val:number) => { return val-272.15 }],
    ['mpg', 'km per liter', 2.35213851109]

]







/**
 * Returns an array of the supported input units
 * @param {string=} output unit to filter by (optional)
 * @returns {string[]} List of input units supported
 */
export function supportedUnits(filter?: string): string[] {
    let ret = []
    for(const map of mapper) {
        const [un,si,f] = map
        if (filter && filter !== si)
            continue
        let u = un || ''
        u = u.replace(/\|.*/,'')
        ret.push(u)
    }
    return ret
}

/**
 * Converts input value-unit pair to metric value-unit pair if unit is supported. Returns null if not.
 * Unit aliases and plurals are resolved, too. So e.g. 'ft' and 'feet' resolved to 'foot' or
 * 'mi' and 'miles' to 'mile'.
 * 
 * @param {ValUnitPair} input: The value-unit pair to convert from
 * @returns {ValUnitPair | null} [SIUnit, converted value] or null
 * @throws
 */
export function convert(input: ValUnitPair):ValUnitPair|null {
    let [val, unit] = input
    if (typeof unit !== typeof '' || !Number.isFinite(val))
        throw "Wrong argument"
    else if (unit.length === 0)
        return null

    unit = unit.toLowerCase()
    
    for (const map of mapper) {
        const [un,si,f] = map
        let re = new RegExp('^(' + un + ')$')
        if (!re.test(unit)) continue
        let newVal
        if (typeof f === 'number')
            newVal = val*f
        else if (typeof f === 'function')
            newVal = f(val)
        else
            throw `Unexpedted value: ${f}`
        return [newVal, si]
    }
    if (unit.endsWith('s'))
        return convert([val, unit.slice(0,-1)])
    
    return null
}

/**
 * Formats converted value-unit pair in a user-friendly manner, changing dimensions as necessary
 * @param arr Converted value in [value, SI-unit] format
 * @returns {string} Formatted value with unit at the end ( e.g. '1.2 cm')
 */
export function toHumanReadable(arr: ValUnitPair): string {
    if (!arr || !Array.isArray(arr)) return ''
    
    let [val,format] = arr
    if (!val || !Number.isFinite(val)) return ''

    // trim 
    const numF = (val:number) => {
        // trim ending zeros: 5.000 => 5 ; 5.120 => 5.12
        return val.toFixed(3).replace(/\.?0+$/,'')
    }

    if ('m,W,m/s'.split(',').indexOf(format)>=0) {
        if (val>1e9)
            return numF(val/1e9) + ' G' + format
        else if (val>1e6)
            return numF(val/1e6) + ' M' + format
        else if (val>1000)
            return numF(val/1000) + ' k' + format
        else if (val<0.1)
            return numF(val*1000) + ' m' + format
    } else if ('g' === format) {
        if (val>1e6)
            return numF(val/1e6) + ' tonne'
        else if (val>1000)
            return numF(val/1000) + ' kg'
        else if (val>0.1)
            return numF(val*1000) + ' mg'
    } else if ('m2' === format) {
        if (val>1e6)
            return numF(val/1e6) + ' k' + format
        else if (val<0.01)
            return numF(val*1e4) + ' cm2'
    } else if ('l' === format) {
        if (val>1000)
            return numF(val/1000) + ' m3'
        else if (val<0.01)
            return numF(val*1000) + ' cm3'
        else
            return numF(val) + ' liter'
    }
    return numF(val) + ' ' + format
}

type Parsed = {
    valueIn?: number,
    valueOut?: number,
    unitIn?: string,
    unitOut?: string,
    humanOut?: string
}

/**
 * Parses a given string for number(s) and units to convert from
 * @param str:string The input string to parse
 * @returns a Parsed object filled with the result
 */
export function parseStr(str: string): Parsed {
    if (typeof str !== 'string' || !str.length)
        return {}
    
    str = str.trim().toLowerCase()
    let m
    
    // '6ft 1in' format?
    m = str.match(/(.+?)\s*(ft|foot|feet|')\s+(.+?)\s*(in|inch|")/)
    if (m && !Number.isNaN(Number.parseFloat(m[1])) && !Number.isNaN(Number.parseFloat(m[3]))) {
        const foot = convert([Number.parseFloat(m[1]),'foot'])
        const inch = convert([Number.parseFloat(m[3]),'inch'])
        if(foot && inch) {
            return {
                valueIn: Number.parseFloat(m[1]),
                unitIn: 'foot',
                valueOut: foot[0],
                unitOut: foot[1],
                humanOut: toHumanReadable([foot[0]+inch[0],foot[1]])
            }
        }
    }
    
    // '5 degF' format?
    m = str.match(/([0-9e\,\.-]+)\s*(.+)$/)
    if (m && !Number.isNaN(Number.parseFloat(m[1]))) {
        const vin = Number.parseFloat(m[1])
        const v = convert([vin,m[2]])
        console.log(v)
        if (v) {
            return {
                valueIn: vin, unitIn: m[2],
                valueOut: v[0], unitOut: v[1],
                humanOut: toHumanReadable(v)
            }
        }
    }

    // maybe just the unit?
    const v = convert([1,str])
    if (v) {
        return {
            valueIn: 1, unitIn: str,
            valueOut: v[0], unitOut: v[1],
            humanOut: toHumanReadable(v) }
    }
    
    // giving up
    return {}
}
