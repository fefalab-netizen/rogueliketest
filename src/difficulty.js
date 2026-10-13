export const difficulties={
 explorer:{name:'Explorer',damage:.70,hp:.85,budget:.80,elite:.02,coordination:.85,hazard:.75},
 adventurer:{name:'Adventurer',damage:1,hp:1,budget:1,elite:.07,coordination:1,hazard:1},
 veteran:{name:'Veteran',damage:1.20,hp:1.15,budget:1.20,elite:.14,coordination:1.2,hazard:1.15},
 nightmare:{name:'Nightmare',damage:1.40,hp:1.30,budget:1.35,elite:.22,coordination:1.4,hazard:1.3},
};
export const difficultyFor=world=>difficulties[world.difficulty]||difficulties.adventurer;
export function tuneEnemy(enemy,world){
 if(enemy.difficultyApplied)return enemy;
 const d=difficultyFor(world);enemy.hp=enemy.maxHp=Math.round(enemy.maxHp*d.hp);enemy.damage=Math.round(enemy.damage*d.damage);enemy.difficultyApplied=true;return enemy;
}
