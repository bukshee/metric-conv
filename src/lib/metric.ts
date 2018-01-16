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
    ['cu-in|cu in'  , 'l', 0.016387064],
    ['fl-oz|fl oz'  , 'l', 0.029573529],

    // area
    ['acre'         , 'm2', 4046.85642],
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
    ['fahrenheit|f|degf', 'C', (val:number) => { return (val-32)*5/9 }],
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
        console.log(re)
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

    if ('m,W,m/s'.split(',').indexOf(format)>=0) {
        if (val>1e9)
            return (val/1e9).toFixed(3) + ' G' + format
        else if (val>1e6)
            return (val/1e6).toFixed(3) + ' M' + format
        else if (val>1000)
            return (val/1000).toFixed(3) + ' k' + format
        else if (val<0.1)
            return (val*1000).toFixed(3) + ' m' + format
    } else if ('g' === format) {
        if (val>1e6)
            return (val/1e6).toFixed(3) + ' tonne'
        else if (val>1000)
            return (val/1000).toFixed(3) + ' kg'
        else if (val>0.1)
            return (val*1000).toFixed(3) + ' mg'
    } else if ('m2' === format) {
        if(val>1e6)
            return (val/1e6).toFixed(3) + ' k' + format
    } else if ('liter' === format) {
        if (val>1000)
            return (val/1000).toFixed(3) + ' m3'
        else if (val<100)
            return (val*1000).toFixed(3) + ' cm3'
    }
    return val.toFixed(3) + ' ' + format
}

//console.log(inputUnits('l'))
/*const converter = unitToConverter('pound')
if (converter)
    console.log(converterToString(converter((3.04))))*/