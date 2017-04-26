const request = require('request');
const cheerio = require('cheerio');

const NOW_DUST_URL = 'http://aqicn.org/city/seoul/';
const WEEK_WEATHER_URL = 'http://www.kweather.co.kr/kma/kma_digital.html';

const Data = {
  "msg": "ok",
  "code": 1,
  "data" : {
      "id": 1,
      "status" : "",
      "statusNum" : "",
      "locale" : "서울",
      "eachTimeData": []
    }
}

const WeatherApp = {
    checkStatus(statusNum){
        if(statusNum < 60){
            return "좋음";
        }else if(statusNum > 60 || statusNum < 100){
            return "보통";
        }else{
            return "나쁨";
        }
    },

    requestp(url, json) {
        json = json || false;
        return new Promise((resolve, reject) => {
            request({url, json}, (err, res, body) => {
                if (err) {
                    return reject(err);
                } else if (res.statusCode !== 200) {
                    err = new Error("Unexpected status code: " + res.statusCode);
                    err.res = res;
                    return reject(err);
                }
                resolve(body);
            });
        });
    },

    run(context){
        this.requestp(NOW_DUST_URL, false).then((data) => {
            var $ = cheerio.load(data);

            var nowModerate =  $('#citydivmain #aqiwgtvalue').text();
            Data.data.statusNum = nowModerate;
            Data.data.status = this.checkStatus(nowModerate);

            this.requestp(WEEK_WEATHER_URL, false).then((data) => {
                var $ = cheerio.load(data);
                var index = 0;
                var $weekTb = $('.kma_digital_week_cont_table');
                $weekTb.each(function(idx){
                    var $kmaBg01 = $(this).find('.kma_digital_bg_01');
                    var $kmaBg02 = $(this).find('.kma_digital_bg_02');

                    var sky = $kmaBg01.last().find('span').eq(1).text().trim();
                    var day = $kmaBg02.first().text().replace(/\r?\n|\r/g, " ").trim();
                    var lowTemp = $kmaBg02.find('.lifestyle_min').text();
                    var highTemp = $kmaBg02.find('.lifestyle_max').text();

                    Data.data.eachTimeData[idx] = {
                        "id" : idx,
                        "locale" : "서울",
                        "day" : day,
                        "lowTemp" : lowTemp,
                        "highTemp" : highTemp,
                        "sky" : sky
                    }
                });
                context.succeed(Data);
            })
        }, (err) => {
            console.error("%s; %s", err.message, url);
            console.log("%j", err.res.statusCode);
        });
    }
}

exports.handler = (event, context, callback) => {
    WeatherApp.run(context);
}
