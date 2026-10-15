# Даты библиотеки: старый и новый стиль, 15 октября 2026

Находка #10 проверки кода: часть записей библиотеки хранила дату по юлианскому календарю,
хотя комментарий в коде обещает григорианский. Агент-исследователь сверил 137 записей, где это
возможно (Российская империя до 1918, Британия до 1752, протестантские Германия, Дания, Швейцария,
Нидерланды до перехода), по английской и русской Википедии и Wikidata. Сырые данные и ссылки
лежали в рабочей папке ночной сессии; ниже итог.

- верно сейчас: 105
- исправлено ночью (высокая уверенность: обе Википедии или явное указание обоих стилей): 17
- ждут решения: 15

## Исправлено

| запись | было | стало | основание |
|---|---|---|---|
| Карл Павлович Брюллов | 12.12.1799 | 23.12.1799 | en: 23 December [O.S. 12 December] 1799; ru: 12 [23] декабря. |
| Михаил Иванович Глинка | 02.06.1803 | 01.06.1804 | en: 1 June [O.S. 20 May] 1804; ru: 20 мая [1 июня] 1804. Stored 1803-06-02 is wrong year and day (Wikidata marks 1803-06-02 deprecated). |
| Юзеф Игнацы Крашевский | 28.06.1812 | 28.07.1812 | Warsaw (Duchy of Warsaw), Gregorian. en/pl/ru all give 28 July 1812; stored month is wrong (06 instead of 07). Wikidata marks 1812-06-28 deprecated. |
| Тарас Григорьевич Шевченко | 26.02.1814 | 09.03.1814 | ru: 25 февраля [9 марта] 1814; en: 9 March 1814. Stored 26 Feb matches neither (Wikidata marks 1814-02-26 deprecated; 26 Feb is his death day O.S.). |
| Иван Иванович Шишкин | 25.01.1831 | 25.01.1832 | en: 25 January [O.S. 13 January] 1832; ru: 13 (25) января 1832. Stored has the right day but wrong YEAR (1831). Wikidata prefers 1831, against both Wikipedias. |
| Цезарь Антонович Кюи | 06.01.1835 | 18.01.1835 | Vilna, Russian Empire. en: 18 January [O.S. 6 January] 1835; ru: 6 января [18 января]. |
| Ян Матейко | 30.07.1838 | 24.06.1838 | Free City of Kraków: Gregorian. en/pl/ru all give 24 June 1838; stored 30 July matches neither (Wikidata has it as a non-preferred value). |
| Анатолий Константинович Лядов | 11.05.1855 | 12.05.1855 | en: 12 May [O.S. 30 April] 1855; ru: 30 апреля [12 мая]. Stored 11 May matches neither (off by one day; older references give 29 April [11 May]). |
| Лев Бакст | 27.04.1866 | 08.02.1866 | en: 8 February [O.S. 27 January] 1866; ru: 27 января [8 февраля]. Stored 27 April matches neither (an older variant, 27 April [10 May] 1866, appears in Wikidata |
| Борис Михайлович Кустодиев | 23.02.1878 | 07.03.1878 | en: 7 March [O.S. 23 February] 1878. ru lead gives only 23 февраля 1878 (the Old Style date, unmarked). |
| Наталья Сергеевна Гончарова | 16.06.1881 | 03.07.1881 | ru: 21 июня [3 июля] 1881; en: 3 July 1881. Stored 16 June matches neither (Wikidata carries an unsourced 4 June O.S./16 June variant). Birthplace also disputed |
| Белокур, Екатерина Васильевна | 08.12.1900 | 07.12.1900 | en: 7 December [O.S. 24 November] 1900; uk: 24 листопада (7 грудня) 1900; ru body: 24 ноября (7 декабря). Only the ru lead says 25 ноября [8 декабря], which is  |
| Луис Кан | 20.02.1901 | 05.03.1901 | Kuressaare (Arensburg), Livonia Governorate. en: 5 March [O.S. 20 February] 1901; ru: 20 февраля 1901 (the Old Style date, unmarked). Note: many US sources give |
| Иоганн Пахельбель | 01.09.1653 | 11.09.1653 | Nuremberg, Protestant Imperial City: Julian calendar in force. en: baptised 11 September [O.S. 1 September] 1653. STORED IS THE BAPTISM DATE in Old Style (ru ca |
| Георг Филипп Телеман | 14.03.1681 | 24.03.1681 | Magdeburg (Brandenburg, Protestant): Julian calendar in force. en: 24 March 1681 [O.S. 14 March 1680] (the '1680' looks like an English Lady Day year; German ye |
| Иоганн Христиан Бах | 01.09.1735 | 05.09.1735 | Leipzig (Saxony): Protestant German states used the Julian calendar until Feb 1700 (then the 'improved' calendar, equal to Gregorian). 1735 is Gregorian. en/de/ |
| Иоганн Генрих Фюссли | 06.02.1741 | 07.02.1741 | Zurich: Gregorian since Jan 1701. en/de/ru all give 7 February 1741; stored 6 Feb matches none (not a calendar shift). |

## Ждут решения Дафы

Средняя или низкая уверенность, спорная дата или дата крещения вместо рождения. Ничего из этого не менялось.

| запись | сейчас | предлагается | почему не исправлено |
|---|---|---|---|
| Генри Пёрселл | 10.09.1659 | 20.09.1659 | medium: Wikipedia gives c. 10 September 1659 with an explicit footnote that England then used the Julian calendar; the day itself is uncertain (no baptism record; year from memorial tablet). Gregorian computed (+10). |
| Уильям Хогарт | 10.11.1697 | 20.11.1697 | medium: Sources give 10 November 1697 without a style marker; England used the Julian calendar until Sept 1752; English Wikipedia and ODNB give pre-1752 English dates as recorded (Old Style, year from 1 Jan). Not a Jan-Mar date, |
| Джошуа Рейнолдс | 16.07.1723 | 27.07.1723 | medium: Sources give 16 July 1723 (ODNB-based) without marker; England used the Julian calendar until Sept 1752; English Wikipedia and ODNB give pre-1752 English dates as recorded (Old Style, year from 1 Jan). Not a Jan-Mar date |
| Джордж Стаббс | 25.08.1724 | 05.09.1724 | medium: en gives 25 August 1724; ru and Wikidata (preferred) give 24 August. England used the Julian calendar until Sept 1752; English Wikipedia and ODNB give pre-1752 English dates as recorded (Old Style, year from 1 Jan). Not  |
| Томас Гейнсборо | 14.05.1727 | 25.05.1727 | medium: 14 May 1727 is the BAPTISM date (birth date unknown). England used the Julian calendar until Sept 1752; English Wikipedia and ODNB give pre-1752 English dates as recorded (Old Style, year from 1 Jan). Not a Jan-Mar date, |
| Джозеф Райт | 03.09.1734 | 14.09.1734 | medium: Sources give 3 September 1734 without marker; England used the Julian calendar until Sept 1752; English Wikipedia and ODNB give pre-1752 English dates as recorded (Old Style, year from 1 Jan). Not a Jan-Mar date, so no d |
| Фредерик Шопен | 22.02.1810 | 01.03.1810 | medium: Duchy of Warsaw used the Gregorian calendar, so no style issue. Stored 22 Feb is the birthday written in the parish baptismal record (dated 23 Apr 1810); Chopin and his family used 1 March, which en/ru Wikipedia lead wit |
| Игнаций Ян Падеревский | 18.11.1860 | 06.11.1860 | medium: Kurilivka, Podolia, Russian Empire. en: 6 November [O.S. 25 October] 1860; pl: 25 października/6 listopada 1860. ru instead says 6 (18) ноября, treating 6 Nov as Old Style. Stored 18 Nov follows ru; two sources (en, pl)  |
| Василий Васильевич Кандинский | 04.12.1866 | 16.12.1866 | medium: en (and most references incl. Britannica): 16 December [O.S. 4 December] 1866. CONFLICT: ru Wikipedia gives 22 ноября [4 декабря] 1866 and says he was baptised in the Church of St Nicholas in Khlynov on 30 November 1866  |
| Осип Цадкин | 14.07.1890 | ? | low: Disputed beyond calendar style. en (archival research): born 28 January 1888 in Vitebsk, style not stated. ru: 14 июля 1890 (the date Zadkine himself gave). Wikidata prefers 4 July 1888. Stored 1890-07-14 is his self-rep |
| Сергей Сергеевич Прокофьев | 23.03.1891 | 23.04.1891 | medium: ru: 11 [23] апреля 1891, the date Prokofiev gave repeatedly in his diary; en: 27 April [O.S. 15 April] 1891, from a copy of the birth (metric) record. Stored 1891-03-23 is a month off and matches neither. 1891-04-23 reco |
| Тамара Лемпицка | 16.05.1898 | 16.06.1894 | medium: en and pl: 16 June 1894 (Warsaw, or Moscow per pl); ru: 16 мая 1898, the date she gave herself (she shaved years off). Stored follows ru. If born in Warsaw, Gregorian applies and no style issue; if Moscow, the style of 1 |
| Готфрид Кнеллер | 08.08.1646 | 18.08.1646 | medium: Lübeck, Protestant Free City: Julian calendar in force (until 1700). Sources give 8 August 1646 with no style marker; as Lübeck (and his later home, England) were both Julian, it is the recorded Old Style date. Gregorian |
| Мария Сибилла Мериан | 02.04.1647 | 12.04.1647 | medium: Frankfurt am Main, Protestant Free Imperial City: Julian calendar in force (until 1700). All sources give 2 April 1647 with no style marker = the recorded Old Style date. Gregorian computed (+10). |
| Ульрика Элеонора Датская | 11.09.1656 | 21.09.1656 | medium: Copenhagen: Denmark-Norway used the Julian calendar until Feb 1700. en/da/sv give 11 September 1656 unmarked; Danish and Swedish historiography give pre-1700 dates in Old Style. Gregorian computed (+10). |

**Мой совет по британским записям до 1752 года** (Пёрселл, Хогарт, Рейнолдс, Стаббс,
Гейнсборо, Райт): английская традиция и Oxford DNB дают даты до 1752 года по старому стилю, так
что перевод на новый (+10 или +11 дней) почти наверняка верен; уверенность средняя только потому,
что ни один источник не пишет это явно у самой даты. То же для Кнеллера (Любек), Мериан
(Франкфурт) и Ульрики Элеоноры (Копенгаген): протестантские земли жили по юлианскому до 1700 года.

**Кандинский:** английская Википедия и Britannica дают 16 декабря [4 декабря ст. ст.], русская
22 ноября [4 декабря] с крещением 30 ноября 1866 по старому стилю. Если права русская, нынешнее
04.12.1866 уже григорианское. Нужна метрическая запись.

**Шопен, Задкин, Прокофьев, Лемпицка, Падеревский, Левитан:** дата спорная сама по себе, не из-за
календаря. Решение, какую версию держать, за вами; в карточке стоит назвать вторую версию в `src`.
