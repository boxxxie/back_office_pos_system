// original file
// http://www.kunalbabre.com/projects/table2CSV.js


jQuery.fn.table2CSV = function(options) {
    var options = jQuery.extend({
        separator: ',',
        header: [],
        delivery: 'popup' // popup, value
    },
    options);

    var csvData = [];
    var headerArr = [];
    var el = this;

    //header
    var numCols = options.header.length;
    var tmpRow = []; // construct header avalible array

    if (numCols > 0) {
        for (var i = 0; i < numCols; i++) {
            tmpRow[tmpRow.length] = formatData(options.header[i]);
        }
    } else {
        var form = $(el).filter(':visible').find('thead');
        if(form.length==0) form = $(el).filter(':visible');
        
        form.find('th').each(function() {
            if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
        });
    }

    row2CSV(tmpRow);

    // actual data
    $(el).find('tr').each(function() {
        var tmpRow = [];
        $(this).filter(':visible').find('td').each(function() {
            if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
        });
        row2CSV(tmpRow);
    });
    
    var tmpRow = [];
    $(el).filter(':visible').find('tfoot').find('th').each(function() {
        if ($(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData($(this).html());
    });
    row2CSV(tmpRow);
    
    if (options.delivery == 'popup') {
        var mydata = csvData.join('\n');
        return popup(mydata);
    } else {
        var mydata = csvData.join('\n');
        return mydata;
    }

    function row2CSV(tmpRow) {
        var tmp = tmpRow.join(''); // to remove any blank rows
        // alert(tmp);
        if(tmpRow.length > 0 && tmp != '') {
            var mystr = tmpRow.join(options.separator);
            csvData[csvData.length] = mystr;
        }
    }
    function formatData(input) {
        // replace " with â€œ
        var regexp = new RegExp(/["]/g);
        var output = input.replace(regexp, "â€œ");
        //HTML
        var regexp = new RegExp(/\<[^\<]+\>/g);
        var output = output.replace(regexp, "");
        if (output == "") return '';
        return '"' + output + '"';
    }
    function popup(data) {
        var generator = window.open('', 'csv', 'height=400,width=600');
        generator.document.write('<html><head><title>CSV</title>');
        generator.document.write('</head><body >');
        generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
        generator.document.write(data);
        generator.document.write('</textArea>');
        generator.document.write('</body></html>');
        generator.document.close();
        return true;
    }
};


function toCSVarray(input, delimiter)
{
    delimiter = delimiter || ',';

    var objPattern = new RegExp(
    (
        '(\\' + delimiter + '|\\r?\\n|\\r|^)' +
        '(?:"([^"]*(?:""[^"]*)*)"|' +
        '([^"\\' + delimiter + '\\r\\n]*))'
    ), 'gi');

    var data = [[]];
    var matches = null;
    
    while (matches = objPattern.exec(input))
    {
        var matchedDelimiter = matches[1];

        if (matchedDelimiter.length && (matchedDelimiter != delimiter))
        {
            data.push([]);
        }

        if (matches[2])
        {
            var matchedValue = matches[2].replace(new RegExp('""', 'g'), '"');
        }
        else
        {
            var matchedValue = matches[3];
        }

        data[data.length - 1].push(matchedValue);
    }

    return data;
};