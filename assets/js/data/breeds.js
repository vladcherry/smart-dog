// Справочник пород: размерная группа и диапазон взрослого веса (кг)
export const BREEDS = [
  { id:'chihuahua',  name:'Чихуахуа',                 group:'S',  min:1.5, max:3 },
  { id:'toy',        name:'Той-терьер',               group:'S',  min:1.5, max:3 },
  { id:'yorkshire',  name:'Йоркширский терьер',       group:'S',  min:2,   max:3.5 },
  { id:'spitz',      name:'Померанский шпиц',         group:'S',  min:2,   max:3.5 },
  { id:'dachshund',  name:'Такса',                    group:'S',  min:7,   max:10 },
  { id:'jack',       name:'Джек-рассел-терьер',       group:'S',  min:6,   max:9 },
  { id:'shihtzu',    name:'Ши-тцу',                   group:'S',  min:4,   max:8 },
  { id:'french',     name:'Французский бульдог',      group:'M',  min:9,   max:14 },
  { id:'corgi',      name:'Вельш-корги пемброк',      group:'M',  min:10,  max:14 },
  { id:'beagle',     name:'Бигль',                    group:'M',  min:9,   max:16 },
  { id:'cocker',     name:'Кокер-спаниель',           group:'M',  min:11,  max:15 },
  { id:'border',     name:'Бордер-колли',             group:'M',  min:14,  max:22 },
  { id:'aussie',     name:'Австралийская овчарка',    group:'M',  min:16,  max:29 },
  { id:'husky',      name:'Сибирский хаски',          group:'M',  min:16,  max:27 },
  { id:'samoyed',    name:'Самоед',                   group:'M',  min:17,  max:30 },
  { id:'shepherd',   name:'Немецкая овчарка',         group:'L',  min:22,  max:40 },
  { id:'labrador',   name:'Лабрадор-ретривер',        group:'L',  min:25,  max:36 },
  { id:'golden',     name:'Золотистый ретривер',      group:'L',  min:25,  max:34 },
  { id:'boxer',      name:'Боксёр',                   group:'L',  min:25,  max:32 },
  { id:'doberman',   name:'Доберман',                 group:'L',  min:30,  max:45 },
  { id:'rottweiler', name:'Ротвейлер',                group:'L',  min:35,  max:60 },
  { id:'malamute',   name:'Аляскинский маламут',      group:'L',  min:34,  max:43 },
  { id:'bernese',    name:'Бернский зенненхунд',      group:'XL', min:36,  max:55 },
  { id:'alabai',     name:'Среднеазиатская овчарка',  group:'XL', min:40,  max:80 },
  { id:'newfound',   name:'Ньюфаундленд',             group:'XL', min:45,  max:70 },
  { id:'greatdane',  name:'Немецкий дог',             group:'XL', min:50,  max:90 },
  { id:'mastiff',    name:'Мастиф',                   group:'XL', min:55,  max:100 },
  { id:'other',      name:'Другая / метис',           group:null, min:null, max:null }
];

export const GROUPS = {
  S:  { label:'Мелкая',  hint:'до 10 кг',  maxWalk:45, growthEndWeeks:44 },
  M:  { label:'Средняя', hint:'10–25 кг',  maxWalk:60, growthEndWeeks:52 },
  L:  { label:'Крупная', hint:'25–45 кг',  maxWalk:60, growthEndWeeks:65 },
  XL: { label:'Гигант',  hint:'от 45 кг',  maxWalk:45, growthEndWeeks:78 }
};

export const FOOD_TYPES = {
  dry:  { label:'Сухой корм',  kcal:370 },
  wet:  { label:'Влажный',     kcal:90 },
  raw:  { label:'Натуралка',   kcal:150 }
};
