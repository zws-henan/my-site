import svgCaptcha from 'svg-captcha';


export async function captchaService() {
    const captcha =  svgCaptcha.create({
        size:4,
        ignoreChars:'01iIlOoUu',
        noise:4,
        color:true,
    });
    return captcha;
}