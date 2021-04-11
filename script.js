const pup = require("puppeteer");
const prompt = require('prompt-sync')();
const fs = require("fs");

let FinalData = [];
async function main(){
    let search = await prompt('name :- ');
    let browser = await pup.launch({
        headless : false,
        defaultViewport : false,
        args : ['--start-maximized']
    });

    let page1 = await browser.pages();
    tab = page1[0];
    await tab.goto("https://www.amazon.in/");

    let page2 = await browser.newPage();    
    await page2.goto("https://www.flipkart.com/");

    //AMAZON
    await tab.bringToFront();
    let productUrls = [];
    let AmzProductName = [];
    await tab.waitForSelector(".nav-search-field",{visible : true});
    await tab.type("#twotabsearchtextbox",search);
    await tab.keyboard.press("Enter");
    await tab.waitForNavigation({waitUntil: "networkidle2"});
    let productLink = await tab.$$(".a-size-mini.a-spacing-none.a-color-base.s-line-clamp-4 .a-link-normal.a-text-normal");
    for(let i = 4; i < 8; i++){
        let tempUrl = await tab.evaluate(function(ele){
            return ele.getAttribute("href");
        },productLink[i]);
        productUrls.push(tempUrl);
        
        let tempName = await tab.evaluate(function(ele){
            return ele.textContent;
        },productLink[i]);
        tempName = tempName.replace(/^\s*[\r\n]/gm,"");
        AmzProductName.push(tempName);
    }
    FinalData[0] = {'Amazon' : []};
    for(let j in productUrls){
        await collectInfoAmazon("https://www.amazon.in/"+productUrls[j], await browser.newPage(),AmzProductName[j],j);
    }
    

    // FLIPKART
    productUrls = [];
    let filpProductName = [];
    await page2.bringToFront();
    await page2.waitForSelector("._3704LK",{visible : true});
    await page2.type("._3704LK",search);
    await page2.keyboard.press("Enter");
    await page2.waitForSelector("._1YokD2._3Mn1Gg",{visible : true});
    productLink = await page2.$$("._1AtVbE.col-12-12 ._4ddWXP .s1Q9rs");    
    for(let i = 2; i < 6; i++){
        let tempUrl = await page2.evaluate(function(ele){
            return ele.getAttribute("href");
        },productLink[i]);
        productUrls.push(tempUrl);

        let tempName = await page2.evaluate(function(ele){
            return ele.textContent;
        },productLink[i]);
        filpProductName.push(tempName);
    }
    FinalData[1] = {'Flipkart' : []};
    for(let j in productUrls){
        await collectInfoFilpkart("https://www.flipkart.com"+productUrls[j], await browser.newPage(), filpProductName[j],j);
    }

    
    fs.writeFileSync("ProductInfo.json",JSON.stringify(FinalData));
    tab.close();
    page2.close();
}

async function collectInfoAmazon(url,sidepage,ProductName,j){
    let k = parseInt(j);
    k++;
    let p = k * 5;
    p--;
    await sidepage.goto(url);
    await sidepage.waitForSelector(".a-section.a-spacing-none",{visible : true});
    let tempPrice = await sidepage.$eval("#price .a-span12 #priceblock_ourprice", e1 => e1.innerText);
    FinalData[0]['Amazon'].push(k);
    FinalData[0]['Amazon'].push(ProductName);
    FinalData[0]['Amazon'].push(tempPrice);
    FinalData[0]['Amazon'][p-1] = {'Highlights' : []};
    FinalData[0]['Amazon'][p] = {'Reviews' : []};
    await sidepage.waitForSelector("#twisterPlusWWDesktop",{visible : true});
    let Highlights = await sidepage.$$("#featurebullets_feature_div .a-unordered-list.a-vertical.a-spacing-mini .a-list-item");
    for(let i in Highlights){
        tempHighlight = await sidepage.evaluate(function(ele){
            return ele.textContent;
        },Highlights[i]);
        tempHighlight = tempHighlight.replace(/^\s*[\r\n]/gm,"");
        FinalData[0]['Amazon'][(p-1)]['Highlights'].push(tempHighlight);
    }

    let ReviewUrl = url.replace("/dp/","/product-reviews/");
    await sidepage.goto(ReviewUrl);
    let Review = await sidepage.$$(".a-section.review.aok-relative .a-section.celwidget .a-row.a-spacing-small.review-data");
    for(let i = 0; i < 4; i++){
        let tempReview = await sidepage.evaluate(function(ele){
            return ele.textContent;
        },Review[i]);
        tempReview = tempReview.replace(/^\s*[\r\n]/gm,"");
        FinalData[0]['Amazon'][p]['Reviews'].push(tempReview);
    }   
    sidepage.close();
}

async function collectInfoFilpkart(url,sidepage,ProductName,j){
    let k = parseInt(j);
    k++;
    let p = k * 5;
    p--;
    await sidepage.goto(url);
    await sidepage.waitForSelector("._1AtVbE.col-12-12",{visible : true});
    let tempPrice = await sidepage.$eval("._30jeq3._16Jk6d", e1 => e1.innerText);
    FinalData[1]['Flipkart'].push(k);
    FinalData[1]['Flipkart'].push(ProductName);
    FinalData[1]['Flipkart'].push(tempPrice);
    FinalData[1]['Flipkart'][(p-1)] = {'Highlights' : []};
    FinalData[1]['Flipkart'][p] = {'Reviews' : []};
    let Highlights = await sidepage.$$("._2cM9lP ._21Ahn-");
    for(let i = 0; i < 6; i++){
        let tempHighlight = await sidepage.evaluate(function(ele){
            return ele.textContent;
        },Highlights[i]);
        FinalData[1]['Flipkart'][(p-1)]['Highlights'].push(tempHighlight);
    }
    
    let ReviewUrl = url.replace("/p/","/product-reviews/");
    await sidepage.goto(ReviewUrl);
    let Review = await sidepage.$$("._1AtVbE.col-12-12 .t-ZTKy");
    for(let i = 0; i < 4; i++){
        let tempReview = await sidepage.evaluate(function(ele){
            return ele.textContent;
        },Review[i]);
        tempReview = tempReview.replace(/^\s*[\r\n]/gm,"");
        FinalData[1]['Flipkart'][p]['Reviews'].push(tempReview);
    }
    sidepage.close();
}

main();