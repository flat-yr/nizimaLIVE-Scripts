/*
Rainbow.js
created by flat-yr

nizimaLIVEのスクリプトに取り込むことで、任意の箇所を虹色に変えることができます。

そのまま取り込んでも使用できません。
使用するには、当コードの一部を編集する必要があります。

書き換える場所は当コードの一番下にあります。//****が目印です。
ご自身のLive2Dモデルのパーツ名、アートメッシュ名で書き換えてください。

色味の調整も可能です。
update()に変更できる数値があるのでお好みで調整してください。//****が目印です。
*/


// TODO 
// *1: 2025/6月中にnizimaLIVEの新バージョンにてmultiplyColorの初期値が正しくなる。正しくなったらprevMultiplyColorで元の色に戻す。
// それまではmultiplyColor=whiteでリセットする。


// 線形補間
// a 開始値, b 終了値, t 補間係数 (0.0~1.0)
function lerp(a, b, t) {
    return a + (b - a) * t;
}

// 色を変更するオブジェクト
class Live2DObject {
    // partあるいはdrawableを指定する
    constructor(object) {
        this.targetObject = object;
        this.prevMultiplyColor = live.rgb(object.multiplyColor.r, object.multiplyColor.g, object.multiplyColor.b);
    }
}

// 虹色に操作するオブジェクト
class Rainbow {
    constructor() {
        this.live2DObjectArray = [];
        this.prevTime = 0;
        this.colorIndex = 0;
    }

    // 虹色に変えたいパーツを指定する
    addPart(partId) {
        // 既に配列に追加されていれば何もしない
        if(this.live2DObjectArray.some(n => n.targetObject.id == partId)){
            console.warn(`Part with ID "${partId}" is already added.`);
            return;
        }
        // モデルからパーツを取得する。IDと一致するパーツがあれば配列に追加、IDが間違っていたら警告ログ。
        let part = model.parts.find(n => n.id == partId);
        if(part){
            this.live2DObjectArray.push(new Live2DObject(part));
        }
        else{
            console.warn(`Part with ID "${partId}" not found.`);
        }
    }

    // 虹色に変えたいアートメッシュを指定する
    addDrawable(drawableId) {
        // 既に配列に追加されていれば何もしない
        if(this.live2DObjectArray.some(n => n.targetObject.id == drawableId)){
            console.warn(`Drawable with ID "${drawableId}" is already added.`);
            return;
        }
        // モデルからアートメッシュを取得する。IDと一致するアートメッシュがあれば配列に追加、IDが間違っていたら警告ログ。
        let drawable = model.drawables.find(n => n.id == drawableId);
        if(drawable){
            this.live2DObjectArray.push(new Live2DObject(drawable));
        }
        else{
            console.warn(`Drawable with ID "${drawableId}" not found.`);
        }
    }

    // 色を元の状態に戻す
    reset() {
        this.live2DObjectArray.forEach(n => {
            // TODO *1
            // n.targetObject.multiplyColor = live.rgb(n.prevMultiplyColor.r, n.prevMultiplyColor.g, n.prevMultiplyColor.b);
            n.targetObject.multiplyColor = live.rgb(1, 1, 1);
        });
        this.live2DObjectArray.length = 0;
        this.prevTime = 0;
        this.colorIndex = 0;
    }
 
    update() {
        // ******************************************************************************************************************** //
        // 色の変化を設定できます。お好みで編集してください。
        const MIN_VALUE_RGB = 0;    // RGBの最低値。（原色にするなら0、原色より明るくするなら数値を高めにする）
        const MAX_VALUE_RGB = 255;  // RGBの最高値。（基本は255、より明るくするなら255を超えてもOK）
        const LOOP_SECONDS = 2;     // 虹色の変化が1周するまでの秒数。（高速にしたいなら数値を低くする）
        // ******************************************************************************************************************** //

        // 計算用
        const LOOP_MILLI_SRCONDS = LOOP_SECONDS * 1000; // ミリ秒
        const GRADIENT_MILLI_SECONDS = LOOP_MILLI_SRCONDS / 6; // 1色の遷移にかかる時間
        let r = 0, g = 0, b = 0;

        if(this.prevTime <= 0){
            this.prevTime = Date.now();
        }

        let elapsedTime = Date.now() - this.prevTime;
        if(elapsedTime >= GRADIENT_MILLI_SECONDS){
            elapsedTime -= GRADIENT_MILLI_SECONDS;
            this.prevTime = Date.now();
         
            this.colorIndex++;
            if(this.colorIndex > 6){
                this.colorIndex = 1;
            }
        }

        // 色の値の変化
        let timeRate = elapsedTime / GRADIENT_MILLI_SECONDS;
        switch (this.colorIndex) {
            // 白から赤へ
            case 0:
                r = 255;
                g = lerp(255, MIN_VALUE_RGB, timeRate);
                b = lerp(255, MIN_VALUE_RGB, timeRate);
                break;
        
            // 赤から黄へ
            case 1:
                r = MAX_VALUE_RGB;
                g = lerp(MIN_VALUE_RGB, MAX_VALUE_RGB, timeRate);
                b = MIN_VALUE_RGB;
                break;

            // 黄から緑へ
            case 2:
                r = lerp(MAX_VALUE_RGB, MIN_VALUE_RGB, timeRate);
                g = MAX_VALUE_RGB;
                b = MIN_VALUE_RGB;
                break;

            // 緑から水へ
            case 3:
                r = MIN_VALUE_RGB;
                g = MAX_VALUE_RGB;
                b = lerp(MIN_VALUE_RGB, MAX_VALUE_RGB, timeRate);
                break;

            // 水から青へ
            case 4:
                r = MIN_VALUE_RGB;
                g = lerp(MAX_VALUE_RGB, MIN_VALUE_RGB, timeRate);
                b = MAX_VALUE_RGB;
                break;

            // 青から紫へ
            case 5:
                r = lerp(MIN_VALUE_RGB, MAX_VALUE_RGB, timeRate);
                g = MIN_VALUE_RGB;
                b = MAX_VALUE_RGB;
                break;

            // 紫から赤へ
            case 6:
                r = MAX_VALUE_RGB;
                g = MIN_VALUE_RGB;
                b = lerp(MAX_VALUE_RGB, MIN_VALUE_RGB, timeRate);
                break;

            default:
                break;
        }

        // live.rgb()の引数が0~約1の範囲なので補正する
        r /= 255.0;
        g /= 255.0;
        b /= 255.0;
       
        // 色を適用する
        // 必ず{}で実装する。省略すると実装が解釈されないので注意。
        this.live2DObjectArray.forEach(n => {
            n.targetObject.multiplyColor = live.rgb(r, g, b);
        });
    }
}


let rainbow = new Rainbow();

function onEnable() {
    // ******************************************************************************************************************** //
    // 虹色にしたいパーツ名、アートメッシュ名を指定します。
    rainbow.addPart("PartHairSideL");
    rainbow.addPart("PartHairSideR");
    rainbow.addPart("PartHairAho");
    rainbow.addPart("PartHairFront");
    rainbow.addPart("PartEarL");
    rainbow.addPart("PartEarR");
    rainbow.addPart("PartHairBackL");
    rainbow.addPart("PartBraidsL");
    rainbow.addPart("PartHairBackR");
    rainbow.addPart("PartBraidsR");
    rainbow.addPart("PartHairBack");

    rainbow.addDrawable("ArtMesh243");
    // ******************************************************************************************************************** //
}

function onDisable() {
    rainbow.reset();
}

function update(params) {
    rainbow.update();
}