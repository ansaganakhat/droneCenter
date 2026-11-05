# Презентация мен бейнематериал қосу

Бірінші дәріс: https://ansaganakhat.github.io/droneCenter/#/lecture/01

## Презентация жүктеу

1. [Презентациялар қалтасын ашыңыз](https://github.com/ansaganakhat/droneCenter/tree/main/public/content/lecture-01/presentations).
2. **Add file → Upload files** арқылы PDF, PPT немесе PPTX файлын таңдаңыз.
3. **Commit changes** басыңыз. Actions аяқталғаннан кейін файл «Презентация» бөлімінде автоматты көрінеді.

PDF сайт ішінде оқылады. PPT/PPTX жүктеу сілтемесімен беріледі. HTML веб-презентациялар да қолдау табады.
Файл атауы экрандағы атауға айналады: `01-Kirispe.pdf` → `01 Kirispe`.
Файл атауында бос орын, қазақша әріптер немесе `#` болса да сілтеме дұрыс құрылады.
Қолда бар интерактивті веб-презентация бірінші дәрістің осы бөлімінде көрсетіледі.

## Видео жүктеу

1. [Бейнематериалдар қалтасын ашыңыз](https://github.com/ansaganakhat/droneCenter/tree/main/public/content/lecture-01/videos).
2. **Add file → Upload files** арқылы MP4 немесе WebM файлын қосыңыз.
3. **Commit changes** басыңыз. Actions аяқталғаннан кейін видеоплеер пайда болады.

MP4 үшін кең қолдау табатын H.264/AAC кодектерін қолданған ыңғайлы.
GitHub файл жүктеу кезінде көлем шектеуін көрсетсе, видеоны YouTube-қа орналастырып, сілтемесін қосыңыз.

## YouTube сілтемесін қосу

[materials.json файлын ашыңыз](https://github.com/ansaganakhat/droneCenter/edit/main/public/content/lecture-01/materials.json), қарындаш белгісін басып, `videos` тізімін толтырыңыз:

```json
{
  "presentations": [],
  "videos": [
    {
      "title": "1-дәрістің бейнесабағы",
      "url": "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
      "description": "Пилотсыз авиациялық жүйелерге кіріспе"
    }
  ]
}
```

Бұл тек үлгі: `url` мәнін өз видеоңыздың толық сілтемесімен ауыстырыңыз. Жалған видео сайтқа алдын ала қосылмаған.
Кәдімгі YouTube, youtu.be, Shorts және Live бейне сілтемелері қолдау табады.

## Файлға басқа атау беру немесе сыртқы материал қосу

`materials.json` ішіндегі презентация жазбасына мына үлгідегідей дерек қосыңыз:

```json
{
  "presentations": [
    {
      "title": "Кіріспе дәрісінің слайдтары",
      "path": "presentations/01-Kirispe.pdf",
      "description": "Дәрістің PDF нұсқасы"
    }
  ],
  "videos": []
}
```

Бұл мысалдағы файл алдымен қалтаға жүктелуі керек. Файл табылмаса, жариялау тексеруі нақты қатені көрсетеді.
`path` орнына `url` беріп, сыртқы PDF, презентация немесе видео сілтемесін де қосуға болады.
Бір файл екі рет көрсетілмейді: `materials.json` ішіндегі жеке атау автоматты файл атауын алмастырады.

## Басқа дәрістер

Дәл осы тәсіл барлық 10 дәріске дайын. Мысалы, екінші дәріс үшін:

```text
public/content/lecture-02/presentations/
public/content/lecture-02/videos/
public/content/lecture-02/materials.json
```

Қалталар немесе `materials.json` жоқ болса, оларды тек материал қосқанда жасаңыз.

## Сайттың жаңаруы

Материалдар **main** тармағына сақталған соң GitHub Actions сайтты қайта жинайды.
Сайтты алғаш рет қосу қажет болса: **Settings → Pages → Source → GitHub Actions**.
Құрастыру журналын репозиторийдің **Actions** бөлімінен көруге болады.
`public/data/lectures.generated.json` автоматты жасалады; оны қолмен өңдемеңіз.

Жергілікті компьютерде `npm ci`, кейін `npm run dev` орындаңыз. Файл қосқаннан кейін dev серверін қайта іске қосыңыз.
Қателерді тексеру: `npm test` және `npm run build`.
