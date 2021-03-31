var covidFile = 'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv_v2/COVID19_Fallzahlen_Kanton_BE_total.csv';

Papa.parse(covidFile, {
    download: true,
    header: true,
    skipEmptyLines: true,
	complete: function(results, file) {
        //console.log('Parsing complete:', results.data, file);
        
        var lastvalue = 1;
        var lastvalueVent = 0;
        var jsonData = [];
        results.data.forEach(item => {
            
            var vent =  Number(item.current_vent) === 0 || item.current_vent === '' ? lastvalueVent : Number(item.current_vent);
            var ncumul_conf = Number(item.ncumul_conf) === 0 ? lastvalue : Number(item.ncumul_conf);
            //console.log(item.date, ncumul_conf, Number(item.ncumul_conf));
            newItem = {date: item.date, newPositiv: ncumul_conf - lastvalue, vent: vent, deads: item.ncumul_deceased};
            jsonData.push(newItem);
            
            lastvalue = ncumul_conf;
            lastvalueVent = vent;
        });

        //console.log(jsonData);
        var sevenDayAverage = get7dayAverage(jsonData,'newPositiv');
        //console.log(sevenDayAverage);
        var previousWeekInPercent = getPreviousWeekInPercent(sevenDayAverage);
        var vent7DayAverage = get7dayAverage(jsonData,'vent');
        var statisticData = [];
        statisticData.push(sevenDayAverage);
        statisticData.push(previousWeekInPercent);
        statisticData.push(vent7DayAverage);
        statisticData.push(dateValueDeads(jsonData));
          
        console.log(statisticData);
	    sessionStorage.removeItem('data');
        sessionStorage.setItem('data',JSON.stringify(statisticData));
    }
});

function dateValueDeads(jsonData) {
    var result = [];
    jsonData.forEach(item => {
        result.push({date: item.date, value: item.deads}); 
    });
    return result;
}

function get7dayAverage(jsonData, column) {

    var i = 0;
    var sum7Day = 0;
    var average;
    var result = [];
        
    jsonData.forEach(item => {
        
        var last7Day = getLast7Day(i);
        var last7DayRow = getLast7DayRow(i);

        if(column === 'vent'){
            sum7Day =  sum7Day + item.vent - jsonData[last7DayRow].vent;
        } else {
            sum7Day =  sum7Day + item.newPositiv - jsonData[last7DayRow].newPositiv;
        }
        
        average = last7Day < 0 ? 0 : sum7Day/7;

        result.push({date: item.date, value: average});
        //console.log(i,last7Day,item.newPositiv, average);

        i++;
    }); 
    return result;
}

function getPreviousWeekInPercent(sevenDayAverage) {
    
    var i = 0;
    var previousWeekInPercent;
    var result = [];
        
    sevenDayAverage.forEach(item => {
        
        var last7Day = getLast7Day(i);
        var last7DayRow = getLast7DayRow(i);

        previousWeekInPercent = 100 / sevenDayAverage[last7DayRow].value * item.value - 100;
        
        result.push({date: item.date, value: previousWeekInPercent});
        //console.log(i,last7Day,item.value, previousWeekInPercent);

        i++;
    }); 
    return result;

}

function getLast7Day(i){
    return i-7;
}

function getLast7DayRow(i){
    var last7Day = getLast7Day(i);   
    return last7Day < 0 ? 1 : last7Day;
}
