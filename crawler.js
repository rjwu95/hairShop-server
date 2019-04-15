// 패키지 및 디비 연결
let puppeteer = require('puppeteer');
let mongoose = require('mongoose');
const mongodbUrl = require('./config/mongoose.json').mongodbHost;

mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log('we are connected!');
});

const shopSchema = new mongoose.Schema({
  name: String,
  address: [String],
  category: String,
  rating: Number,
  menu: Object,
  review: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  image: [String],
});

//compile our schema into a model
var shop = mongoose.model('Shop', shopSchema);

/* crawaling */

// 크롤링 실행
(async function() {
  await urlScrap();
})();
////////////////////////////////
async function urlScrap() {
  let browser = await puppeteer.launch({});
  let page = await browser.newPage();

  for (let j = 1; j <= 2499; j++) {
    console.log('page :', j);
    try {
      await page.goto(
        `https://store.naver.com/hairshops/list?page=${j}&query=%EB%AF%B8%EC%9A%A9%EC%8B%A4`,
      );
      try {
        await page.waitFor('li.list_item');
      } catch (err) {
        if (err) console.log(err);
        await page.goto(
          `https://store.naver.com/hairshops/list?page=${j}&query=%EB%AF%B8%EC%9A%A9%EC%8B%A4`,
        );
      }
      let hairShopList = await page.$$('li.list_item');
      for (let shop of hairShopList) {
        //take url from each hairShop list
        await page.waitFor(1000);

        try {
          let url = await shop.$eval('a', function(el) {
            return el.href.match(/.*entry=pll/)[0];
          });
          //////////////////////////////////
          await hairShopScrap(url);
          //////////////////////////////////
        } catch (err) {
          if (err) console.log(err);
        }
      }
    } catch (err) {
      if (err) console.log(err);
    }
  }
  await page.close();
  console.log('매무리');
  await browser.close();
}
//////////////////////////////////////////
const priceScrap = async url => {
  let menu = {};
  let browser = await puppeteer.launch({});

  let page = await browser.newPage();
  try {
    await page.goto(url);
  } catch (err) {
    console.log(err);
  }

  try {
    await page.waitForSelector('div.list_txt_menu_area', { timeout: 5000 });
    let priceLists = await page.$$('div.list_txt_menu_area');

    for (let list of priceLists) {
      let category = await list.$eval('strong.category', el => el.innerText);
      let items = await list.$$eval('li.list_item', lists => {
        return lists.map(el => ({
          name: el.childNodes[0].childNodes[1].innerText,
          price: el.childNodes[0].childNodes[0].innerText,
        }));
      });
      menu[category] = items;
    }
  } catch (err) {
    console.log(err);
  }
  await page.close();
  await browser.close();
  return menu;
};

async function imageScrap(url) {
  let browser = await puppeteer.launch({});

  let images = [];
  let page = await browser.newPage();
  try {
    await page.goto(url);
  } catch (err) {
    console.log(err);
  }

  try {
    await page.waitForSelector('div.list_photo', { timeout: 5000 });
    let imageWrapper = await page.$('div.list_photo');
    let imageFrames = await imageWrapper.$$eval('div.thumb', frames =>
      frames.map(el => el.childNodes[0].src),
    );
    for (let i = 0; i < 5 && i < imageFrames.length; i++) {
      images.push(imageFrames[i]);
    }
    await page.close();
    await browser.close();
    return images;
  } catch (err) {
    console.log(err);
  }
}

async function hairShopScrap(url) {
  // console.log('priceprice', priceScrap);
  let browser = await puppeteer.launch({});

  console.log('샵 스크랩 시작');
  let category, hairShopName;
  let address = [];
  let imageUrls = [];
  let menu = [];
  let page = await browser.newPage();
  try {
    await page.goto(url);
  } catch (err) {
    if (err) console.log(err);
  }

  /* Restaurant Name and Category */
  try {
    await page.waitForSelector('div.biz_name_area', { timeout: 5000 });
    let title = await page.$('div.biz_name_area');
    hairShopName = await title.$eval('strong.name', function(el) {
      return el.innerText;
    });
    category = '미용실';
  } catch (err) {
    if (err) console.log(err);
  }

  try {
    await page.waitForSelector('div.list_bizinfo', { timeout: 5000 });
    let info = await page.$('div.list_bizinfo');
    let temporary = await info.$$eval('span.addr', el => {
      let temp = el.map(element => element.innerText);
      // address = Array.from(new Set(temp));
      return temp;
    });
    address = temporary;
  } catch (err) {
    console.log(err);
  }

  try {
    await page.waitForSelector('div.place_tab_area', { timeout: 5000 });
    let tabArea = await page.$('div.place_tab_area');
    const tabs = await tabArea.$$eval('a.tab', async tabs => {
      return tabs.map(el => el.attributes['aria-label'].value);
    });
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i] === '가격') {
        //////////////////
        try {
          menu = await priceScrap(url + '&tab=price');
        } catch (err) {
          console.log(err);
        }
        //////////////////////
      } else if (tabs[i] === '사진요약') {
        try {
          imageUrls = await imageScrap(url + '&tab=photo');
        } catch (err) {
          console.log(err);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }

  /* Save to the database */
  shop.find({ name: hairShopName }, (err, data) => {
    if (err) console.log(err);
    if (data.length === 0) {
      shop.create({
        name: hairShopName,
        address,
        category,
        menu,
        image: imageUrls,
      });
    }
    console.log('들어감!', hairShopName);
  });

  await page.close();
  await browser.close();
  return;
}
