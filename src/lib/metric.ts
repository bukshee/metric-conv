'use strict'

// holds a map of unit => convFn(val)
var unitMap = new Map();
// aliases for units (ft to foot, bsh to bushel etc)
var unitAlias = new Map();

// distance
unitMap.set('foot', (val:number) => { return [0.3048*val, 'm'] })
unitAlias.set('ft','foot')
unitAlias.set('feet','foot')
unitMap.set('inch', (val:number) => { return [0.0254*val, 'm'] })
unitAlias.set('in','inch')
unitMap.set('yard', (val:number) => { return [0.9144*val, 'm'] })
unitAlias.set('yd','yard')
unitMap.set('mile', (val:number) => { return [1609.344*val, 'm'] })
unitAlias.set('mi','mile')

// mass
unitMap.set('ton', (val:number) => { return [907184.7*val, 'g'] })
unitAlias.set('tn','ton')
unitMap.set('pound', (val:number) => { return [453.5924*val, 'g'] })
unitAlias.set('lb','pound')
unitMap.set('ounce', (val:number) => { return [28.349526*val, 'g'] })
unitAlias.set('oz','ounce')
unitMap.set('carat', (val:number) => { return [0.2*val, 'g'] })
unitAlias.set('ct','carat')

// volume
unitMap.set('gallon (UK)', (val:number) => { return [4.546090*val, 'liter'] })
unitMap.set('gallon', (val:number) => { return [3.7854118*val, 'liter'] })
unitAlias.set('gal','gallon')
unitMap.set('pint', (val:number) => { return [0.473176475*val, 'liter'] })
unitAlias.set('pt','pint')
unitMap.set('bushel (UK)', (val:number) => { return [36.36872*val, 'liter'] })
unitMap.set('bushel', (val:number) => { return [35.239072*val, 'liter'] })
unitAlias.set('bsh','bushel')
unitAlias.set('bu','bushel')
unitMap.set('teaspoon', (val:number) => { return [35.239072*val, 'liter'] })
unitAlias.set('tsp','teaspoon')
unitMap.set('cu-in', (val:number) => { return [0.016387064*val, 'liter'] })
unitAlias.set('cu in','cu-in')
unitMap.set('fl oz', (val:number) => { return [0.029573529*val, 'liter'] })

// area
unitMap.set('acre', (val:number) => { return [4046.85642*val, 'm2'] })
unitMap.set('sq-mi', (val:number) => { return [2589988*val, 'm2'] })
unitAlias.set('sq mi','sq-mi')
unitMap.set('ha', (val:number) => { return [10000*val, 'm2'] })
unitMap.set('fahrenheit', (val:number) => { return [(val-32)*5/9, 'C'] })
unitAlias.set('f','fahrenheit')
unitAlias.set('degf','fahrenheit')

// speed
unitMap.set('knot', (val:number) => { return [0.5144447*val, 'm/s'] })
unitAlias.set('kt','knot')
unitAlias.set('kn','knot')
unitMap.set('km/h', (val:number) => { return [val/3.6, 'm/s'] })
unitAlias.set('kph','km/h')
unitAlias.set('kmph','km/h')
unitMap.set('mph', (val:number) => { return [val/0.44704, 'm/s'] })
unitMap.set('mpg', (val:number) => { return [val*3.7854/1.609344, 'km per liter'] })

// power, torque
unitMap.set('hp', (val:number) => { return [735.49875*val, 'W'] })
unitMap.set('bhp', (val:number) => { return [745.699872*val, 'W'] })
unitMap.set('lb-ft', (val:number) => { return [1.3558179483314*val, 'Nm'] })
unitAlias.set('pound foot','lb-ft')
unitAlias.set('pound feet','lb-ft')

/**
 * Returns an array of the supported input units
 * @returns {string[]} List of input units supported
 */
export function inputUnits(): string[] {
    let ret: string[]=[]
    for(const unit of unitMap.keys())
        ret.push(unit)
    return ret
}

export type Converted = [number, string]
export type ConverterFun = (val:number) => Converted


/**
 * Returns the converter function for the inputUnit if the unit is supported. Returns undef if not.
 * The function returned takes a single argument: the value to convert. Unit aliases and plurals are
 * resolved, too. So e.g. 'ft' and 'feet' resolved to 'foot' or 'mi' and 'miles' to 'mile'.
 * 
 * @param {string} inputUnit The unit to convert from
 * @returns {ConverterFun | undefined} the converter function or undefined
 */
export function unitToConverter(inputUnit:string): ConverterFun|undefined {
    if (typeof inputUnit !== typeof '')
        throw "Wrong argument"
    else if (inputUnit.length === 0)
        return undefined
    
    let s: string = inputUnit.toLowerCase()
    if (unitMap.has(s))
        return unitMap.get(s)
    else if (unitAlias.has(s))
        return unitMap.get(unitAlias.get(s))
    else if (s.endsWith('s'))
        return unitToConverter(s.slice(0,-1))
    else
        return undefined
}

/**
 * Formats converted value in a user-friendly manner, changing dimensions as necessary
 * @param arr Converted value in [value, SI-unit] format
 * @returns {string} Formatted value with unit at the end ( e.g. '1.2 cm')
 */
export function converterToString(arr: Converted): string {
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
            return (val/1000).toFixed(3) + ' m' + format
    } else if ('g' === format) {
        if (val>1e6)
            return (val/1e6).toFixed(3) + ' tonne'
        else if (val>1000)
            return (val/1000).toFixed(3) + ' kg'
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

console.log(inputUnits())
/*const converter = unitToConverter('pound')
if (converter)
    console.log(converterToString(converter((3.04))))*/