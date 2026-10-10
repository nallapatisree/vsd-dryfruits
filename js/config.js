/**
 * Constants: image paths, category images, WhatsApp number, India Post URL, status lists.
 */
const IM={"hero": "assets/images/hero.jpg", "almond": "assets/images/almond.jpg", "cashew": "assets/images/cashew.jpg", "walnut": "assets/images/walnut.jpg", "pista": "assets/images/pista.jpg", "raisin": "assets/images/raisin.jpg", "anjeer": "assets/images/anjeer.jpg", "k_dry": "assets/images/k_dry.jpg", "k_nuts": "assets/images/k_nuts.jpg", "k_seeds": "assets/images/k_seeds.jpg", "k_dates": "assets/images/k_dates.jpg", "k_combo": "assets/images/k_combo.jpg", "k_ladoo": "assets/images/k_ladoo.jpg", "k_gift": "assets/images/k_gift.jpg"},CI={'Dry Fruits':IM.k_dry,Nuts:IM.k_nuts,Seeds:IM.k_seeds,Dates:IM.k_dates,Combos:IM.k_combo},PI={Badam:IM.almond,Kaju:IM.cashew,Walnuts:IM.walnut,Pista:IM.pista,Kismis:IM.raisin,Anjeera:IM.anjeer},cem=c=>CI[c[0]]?`<img src="${CI[c[0]]}" alt="">`:c[1];
const KEY='vsd_v3',ST=['Pending','Confirmed','Processing','Packed','Shipped','Out for Delivery','Delivered','Cancelled'],PAY=['Pending','Paid','Failed','Refunded','COD'],WA='918885355666',IP='https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx';

const THEMES=[['green','Forest Green','#1b5e38','#b57a2a'],['maroon','Royal Maroon','#8b1e2d','#c8923a'],['blue','Ocean Blue','#1d4e89','#d49a3a'],['brown','Chocolate Brown','#6b3f1d','#c8923a']];
