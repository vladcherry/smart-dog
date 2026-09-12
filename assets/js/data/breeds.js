// Справочник пород: размерная группа и диапазон взрослого веса (кг).
// Названия пород и групп — в словарях assets/js/i18n/<язык>.js
export const BREEDS = [
    {
      "id": "chihuahua",
      "group": "S",
      "min": 1.5,
      "max": 3
    },
    {
      "id": "toy",
      "group": "S",
      "min": 1.5,
      "max": 3
    },
    {
      "id": "yorkshire",
      "group": "S",
      "min": 2,
      "max": 3.5
    },
    {
      "id": "spitz",
      "group": "S",
      "min": 2,
      "max": 3.5
    },
    {
      "id": "dachshund",
      "group": "S",
      "min": 7,
      "max": 10
    },
    {
      "id": "jack",
      "group": "S",
      "min": 6,
      "max": 9
    },
    {
      "id": "shihtzu",
      "group": "S",
      "min": 4,
      "max": 8
    },
    {
      "id": "french",
      "group": "M",
      "min": 9,
      "max": 14
    },
    {
      "id": "corgi",
      "group": "M",
      "min": 10,
      "max": 14
    },
    {
      "id": "beagle",
      "group": "M",
      "min": 9,
      "max": 16
    },
    {
      "id": "cocker",
      "group": "M",
      "min": 11,
      "max": 15
    },
    {
      "id": "border",
      "group": "M",
      "min": 14,
      "max": 22
    },
    {
      "id": "spanwater",
      "group": "M",
      "min": 14,
      "max": 22
    },
    {
      "id": "aussie",
      "group": "M",
      "min": 16,
      "max": 29
    },
    {
      "id": "husky",
      "group": "M",
      "min": 16,
      "max": 27
    },
    {
      "id": "samoyed",
      "group": "M",
      "min": 17,
      "max": 30
    },
    {
      "id": "shepherd",
      "group": "L",
      "min": 22,
      "max": 40
    },
    {
      "id": "labrador",
      "group": "L",
      "min": 25,
      "max": 36
    },
    {
      "id": "golden",
      "group": "L",
      "min": 25,
      "max": 34
    },
    {
      "id": "boxer",
      "group": "L",
      "min": 25,
      "max": 32
    },
    {
      "id": "doberman",
      "group": "L",
      "min": 30,
      "max": 45
    },
    {
      "id": "rottweiler",
      "group": "L",
      "min": 35,
      "max": 60
    },
    {
      "id": "malamute",
      "group": "L",
      "min": 34,
      "max": 43
    },
    {
      "id": "bernese",
      "group": "XL",
      "min": 36,
      "max": 55
    },
    {
      "id": "alabai",
      "group": "XL",
      "min": 40,
      "max": 80
    },
    {
      "id": "newfound",
      "group": "XL",
      "min": 45,
      "max": 70
    },
    {
      "id": "greatdane",
      "group": "XL",
      "min": 50,
      "max": 90
    },
    {
      "id": "mastiff",
      "group": "XL",
      "min": 55,
      "max": 100
    },
    {
      "id": "other",
      "group": null,
      "min": null,
      "max": null
    }
  ];

export const GROUPS = {
    "S": {
      "maxWalk": 45,
      "growthEndWeeks": 44
    },
    "M": {
      "maxWalk": 60,
      "growthEndWeeks": 52
    },
    "L": {
      "maxWalk": 60,
      "growthEndWeeks": 65
    },
    "XL": {
      "maxWalk": 45,
      "growthEndWeeks": 78
    }
  };

export const FOOD_TYPES = {
    "dry": {
      "kcal": 370
    },
    "wet": {
      "kcal": 90
    },
    "raw": {
      "kcal": 150
    }
  };
