'use strict'
import {parseStr} from './lib/metric'

document.addEventListener('DOMContentLoaded', () => {

    const defTxt = '1 atm'

    const updateConverted = (v?:string) => {
        let el:HTMLInputElement = <HTMLInputElement>document.getElementById('text-in')!
        if (v) el.value = v
        else v = el.value
        const converted = parseStr(v.trim()).humanOut
        document.getElementById('converted')!.innerText = `${v} = ${converted}`
        return converted
    }

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
          if (request.selected)
            updateConverted(request.selected) || updateConverted(defTxt)
        });
        
    if (chrome.tabs)
        chrome.tabs.executeScript({
            code: 'chrome.runtime.sendMessage({selected: window.getSelection().toString()})'
        }, _=>chrome.runtime.lastError /* "check" error */);
    
    // Hitting <Enter> in textbox initiates convert
    const textIn:HTMLInputElement = <HTMLInputElement>document.getElementById('text-in')!
    textIn.addEventListener('keydown', (ev:KeyboardEvent) => {
        var keypressed = ev.keyCode || ev.which;
        if (keypressed == 13)
            updateConverted()
    })
    textIn.focus()
    var btnConvert:HTMLButtonElement= <HTMLButtonElement>document.getElementById('convert-btn')!;

    // Ensure the background color is changed and saved when the dropdown
    // selection changes.
    btnConvert.addEventListener('click', (ev) => {
        updateConverted()
    });
});
