/* global on log playerIsGM findObjs getObj getAttrByName sendChat globalconfig */ // eslint-disable-line no-unused-vars

/*
GMSheet %%version%%

A quick GM Cheatsheet for the D&D 5e OGL sheets on roll20.net.
Please use `!gmsheet` for inline help and examples.

arthurbauer@me.com
*/

on('ready', () => {
  const v = '%%version%%'; // version number
  const scname = 'GMSheet'; // script name
  log(`${scname} v${v} online. Select one or more party members, then use \`!gmsheet -h\``);
  let output = '';
  let collectedAttributes = '';
  let wantedAttributes;
  let columnjumper = 0;
  let myoutput = '';
  let resourceName = '';
  let otherresourceName = '';

  const resolveAttr = (cid, attname) => {
    const attobj = findObjs({
      type: 'attribute',
      characterid: cid,
      name: attname,
    }, { caseInsensitive: true })[0];
    if (!attobj) {
      return { name: '', current: '', max: '' };
    }
    const att2 = { name: attobj.get('name'), current: attobj.get('current'), max: attobj.get('max') };
    return att2;
  };


  const getCharMainAtt = (cid2) => {
    //! Main attributes
    output = '<table border=0><tr>';
    const cid = cid2.id;
    wantedAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    wantedAttributes.forEach((myAtt) => {
      collectedAttributes = resolveAttr(cid, myAtt);
      output += `<td><strong>${collectedAttributes.name.slice(0, 3).toUpperCase()}:</strong></td><td>&nbsp;${resolveAttr(cid, `${myAtt}_mod`).current > 0 ? `+${resolveAttr(cid, `${myAtt}_mod`).current}` : resolveAttr(cid, `${myAtt}_mod`).current}</td><td>&nbsp;<small>(${collectedAttributes.current})</small></td><td>&nbsp;&nbsp;</td>`;
      if (columnjumper === 1) {
        output += '</tr><tr>';
        columnjumper = 0;
      } else {
        columnjumper = 2;
      }
    });
    output += '</tr></table>';
    return output;
  };

  const getCharOtherAtt = (cid2) => {
    //! Other Attributes
    output = '';
    const cid = cid2.id;
    const hp = parseInt(resolveAttr(cid, 'hit_points').current, 10);
    const maxhp = parseInt(resolveAttr(cid, 'hit_points').max, 10);
    const hpdown = maxhp - hp;
    const hppercentage = Math.floor(((100 * hp) / maxhp) / 5) * 5;
    const level  = parseInt(resolveAttr(cid, 'level').current, 0);
    const xp = parseInt(resolveAttr(cid, 'xp').current, 0);
    const level2  = parseInt(resolveAttr(cid, 'level2').current, 0);

    output = `<br><small><i>${resolveAttr(cid, 'race').current} Lvl ${level} ${resolveAttr(cid, 'class').current}</i></small>`;
    if (level2 > 0) {
      output += `<br><small><i>Lvl ${level2} ${resolveAttr(cid, 'class2').current}</i></small>`;
    }
    output += `<br><small><i>XP: ${xp}</i></small>`;
    output += (resolveAttr(cid, 'inspiration').current === 'on' ? " <strong style='color:white;text-shadow: 2px 2px 4px #009000;' title='Character has inspiration!'>&#127775;</strong>" : '');
    output += `<br><br><strong>HP:</strong> ${hp}/${maxhp} `;
    output += (hp < maxhp ? ` <small style='color:#9d0a0e' title='down by ${hpdown} points, (${hppercentage}%) '>&#129301; ${hppercentage}% (-${hpdown} HP)</small> ` : '');
    output += `<br><strong>AC:</strong> ${resolveAttr(cid, 'ac').current}`;
    output += `<br><br>Move: ${resolveAttr(cid, 'movement_rate').current} ft/rnd, Passive Perception: ${resolveAttr(cid, 'perception').current}<br>Initiative bonus: ${resolveAttr(cid, 'initiative').current > 0 ? `+${resolveAttr(cid, 'initiative_bonus').current}` : resolveAttr(cid, 'initiative_bonus').current}, Proficiency ${resolveAttr(cid, 'pb').current > 0 ? `+${resolveAttr(cid, 'pb').current}` : resolveAttr(cid, 'pb').current}`;
    output += '<br><br>';
    return output;
  };

  // output for CSV
  const getCharSimpleAtt = (cid2) => {
    output = '';
    const cid = cid2.id;
    const hp = parseInt(resolveAttr(cid, 'hit_points').current, 10);
    const maxhp = parseInt(resolveAttr(cid, 'hit_points').max, 10);
    const c_class = resolveAttr(cid, 'class').current;
    const level  = parseInt(resolveAttr(cid, 'level').current, 0);

    const c_class2 = resolveAttr(cid, 'class2').current;
    const level2  = parseInt(resolveAttr(cid, 'level2').current, 0);

    const move = parseInt(resolveAttr(cid, 'movement_rate').max, 10);
    const xp = parseInt(resolveAttr(cid, 'xp').current, 0);
    const purse = resolveAttr(cid, 'purse_items').current.replace(/(\r\n|\n|\r)/gm,' ').replace(/,/gm," ");

    myoutput = `<br><div style='display:inline-block;'>Name,Class/Lvl,Xp,Hp,Move</div>`;
    if (level2 > 0) {
      output += `${c_class}/${level} ${c_class2}/${level2},${xp},${hp}/${maxhp},${move},${purse}`;
    } else {
      output += `${c_class}/${level},${xp},${hp}/${maxhp},${move},${purse}`;
    }

    return output;
  };

  const getSpellSlots = (cid2) => {
    //! Spell slots
    output = '';
    const cid = cid2.id;

    output = '<br><b>Spell slots</b><br>';
    let i = 1;
    let spellLevelTotal = 0;
    let spellLevelEx = 0;
    let spellcount = 0;
    while (i < 10) {
      spellLevelTotal = resolveAttr(cid, `lvl${parseInt(i, 10)}_slots_total`).current;
      if (spellLevelTotal === 0 || spellLevelTotal === '') break;
      spellLevelEx = resolveAttr(cid, `lvl${parseInt(i, 10)}_slots_expended`).current;
      if (spellLevelTotal > 0) {
        spellcount += 1;
        if (spellLevelEx / spellLevelTotal <= 0.25) spellLevelEx = `<span style='color:red'>${spellLevelEx}</span>`;
        else if (spellLevelEx / spellLevelTotal <= 0.5) spellLevelEx = `<span style='color:orange'>${spellLevelEx}</span>`;
        else if (spellLevelEx / spellLevelTotal <= 0.75) spellLevelEx = `<span style='color:green'>${spellLevelEx}</span>`;
        else spellLevelEx = `<span style='color:blue'>${spellLevelEx}</span>`;
        output += `<b>Level ${i}:</b> ${spellLevelEx} / ${spellLevelTotal}<br>`;
      }
      i += 1;
    }
    if (spellcount < 1) output = '';

    //! class resources

    resourceName = resolveAttr(cid, 'class_resource_name').current;
    otherresourceName = resolveAttr(cid, 'other_resource_name').current;

    const classResourceTotal = resolveAttr(cid, 'class_resource').max;
    const classResourceCurrent = resolveAttr(cid, 'class_resource').current;
    const otherResourceTotal = resolveAttr(cid, 'other_resource').max;
    const otherResourceCurrent = resolveAttr(cid, 'other_resource').current;


    if (resourceName && classResourceTotal > 0) output += `<br>${resourceName}: ${classResourceCurrent}/${classResourceTotal}`;
    if (otherresourceName && otherResourceTotal > 0) output += `<br>${otherresourceName}: ${otherResourceCurrent}/${otherResourceTotal}`;
    resourceName = '';

    return output;
  };

  on('chat:message', (msg) => {
    if (msg.type !== 'api' && !playerIsGM(msg.playerid)) return;
    if (msg.content.startsWith('!gmsheet') !== true) return;
    if (msg.content.includes('-help') || msg.content.includes('-h')) {
      //! Help
      sendChat(scname, `/w gm %%README%%`); // eslint-disable-line quotes

    } else if (msg.selected == null) {
      sendChat(scname, '/w gm **ERROR:** You need to select at least one character.');

      /* will add a routine to save/load characters later */
    } else {

      const csv_output = (msg.content.includes('-table') || msg.content.includes('-t'));

      if (csv_output) {
        myoutput = `<br><div style='display:inline-block;'><small>Name,Class/Lvl,Xp,Hp,Move,Purse</small></div>`;
      }

      msg.selected.forEach((obj) => {
        //! Output
        const token = getObj('graphic', obj._id); // eslint-disable-line no-underscore-dangle
        let character;
        if (token) {
          character = getObj('character', token.get('represents'));
        }
        if (character) {
          /* get the attributes and assemble the output */
          const charname = character.get('name');
          const charicon = character.get('avatar');

          if (myoutput.length > 0) myoutput += '<br>';

          // If CSV make a table
          if (csv_output) {
            myoutput += `<div style='display:inline-block;'><small>${charname},${getCharSimpleAtt(character)}</small></div>`;
          } else {
            myoutput += `<div style='display:inline-block; font-variant: small-caps; color:##9d0a0e; font-size:1.8em;margin-top:5px;'><img src='${charicon}' style='height:48px;width:auto;margin-right:5px;margin-bottom:0px;margin-top:5px; vertical-align:middle'>${charname}</div>${getCharOtherAtt(character)}${getCharMainAtt(character)}${getSpellSlots(character)}`;
          }
        }
      });
      sendChat(scname, `/w gm <div style='border:1px solid black; background-color: #f9f7ec; padding:8px; border-radius: 6px; font-size:0.85em;line-height:0.95em;'>${myoutput}</div>`); // eslint-disable-line quotes
      myoutput = '';
    }
  });
});
