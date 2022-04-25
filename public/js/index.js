const say = require('say');
const electron = require('electron');
const { ipcRenderer, dialog } = electron;

var objTTS = {
    vars: {
        loaderPanel: $('div#loader_panel'),
        modalMessag: new bootstrap.Modal(document.getElementById('modal_message_error'), {
            backdrop: 'static',
            keyboard: false,
            focus: true
        }),
        ssu_available: (!(typeof speechSynthesis === 'undefined') && 'speechSynthesis' in window),
        unu_voices: []
    },
    funs: {
        getSSU_Voices: () => {
            return new Promise(
                function (resolve, reject) {
                    if (objTTS.vars.ssu_available) {
                        let ssuv = window.speechSynthesis.getVoices();
                        if (ssuv.length !== 0) {
                            resolve(ssuv);
                        } else {
                            resolve([]);
                        }
                    } else {
                        resolve([]);
                    }
                }
            )
        },
        openLoaderPanel: () => {
            objTTS.vars.loaderPanel.show();
        },
        closeLoaderPanel: () => {
            objTTS.vars.loaderPanel.hide();
        },
        launchErrorModal: (tem) => {
            $('p#ctrl_paragraph').empty();
            switch(tem){
                case 'tts':
                    $('p#ctrl_paragraph').text('Please enter text to synthesizes in speech');
                    break;
                case 'vc':
                    $('p#ctrl_paragraph').text('Please, selected a voice');
                    break;
                default:
                    $('p#ctrl_paragraph').text('An error has occurred');
                    break;
            }
            objTTS.vars.modalMessag.show();
        },
        habilitarControl: (idCtrl, habilitar) => {
            if (habilitar) {
                // Habilitar control
                $(idCtrl).removeAttr('disabled');
            } else {
                // Deshabilitar control
                $(idCtrl).attr('disabled', 'disabled');
            }
        }
    }
};

$(document).on('click', 'button#ctrl_btn_play', function() {
    // Deshabilitar control
    objTTS.funs.habilitarControl('button#ctrl_btn_play', false);
    // Validar si hay una voz seleccionada
    let idxv = parseInt($('select#ctrl_select_voice option:selected').val()),
        my_vcs = objTTS.vars.unu_voices;
    if ((idxv.toString() !== 'NaN') && (my_vcs.length > idxv)) {
        let tts = $('textarea#ctrl_text_to_speech').val().trim(),
            rte = $('input#ctrl_range_rate').val()/100,
            vc = my_vcs[idxv];
        if (tts) {
            // Habilitar control
            $('button#ctrl_btn_stop').removeAttr('disabled');
            say.speak(tts, vc.voice, rte, (err) => {
                // Deshabilitar control
                objTTS.funs.habilitarControl('button#ctrl_btn_stop', false);
                // Habilitar control
                objTTS.funs.habilitarControl('button#ctrl_btn_play', true);
                if (err) {
                    objTTS.funs.launchErrorModal('');
                    return false;
                }
            });
        } else {
            // Habilitar control
            objTTS.funs.habilitarControl('button#ctrl_btn_play', true);
            objTTS.funs.launchErrorModal('tts');
        }
    } else {
        // Habilitar control
        objTTS.funs.habilitarControl('button#ctrl_btn_play', true);
        objTTS.funs.launchErrorModal('vc');
    }
});

$(document).on('click', 'button#ctrl_btn_stop', function() {
    // Deshabilitar control para exportar
    $('button#ctrl_btn_stop').attr('disabled', 'disabled');
    say.stop(() => {
        // Habilitar control para exportar
        $('button#ctrl_btn_play').removeAttr('disabled');
    });
});

$(document).on('click', 'button#ctrl_btn_download', function() {
    objTTS.funs.openLoaderPanel();
    let idxv = parseInt($('select#ctrl_select_voice option:selected').val()),
        my_vcs = objTTS.vars.unu_voices;
    if ((idxv.toString() !== 'NaN') && (my_vcs.length > idxv)) {
        let tts = $('textarea#ctrl_text_to_speech').val().trim(),
            rte = $('input#ctrl_range_rate').val()/100,
            vc = my_vcs[idxv];
        if (tts) {
            ipcRenderer.send('system:download', {
                voice: vc.voice,
                rate: rte,
                tts: tts
            });
        } else {
            objTTS.funs.closeLoaderPanel();
            objTTS.funs.launchErrorModal('tts');
        }
    } else {
        objTTS.funs.closeLoaderPanel();
        objTTS.funs.launchErrorModal('vc');
    }
});

ipcRenderer.on('system:path_save', function(e, params) {
    if (!params.canceled) {
        say.stop(() => {
            say.export(params.tts, params.voice, params.rate, params.filePath /*'<noun>.wav'*/, (err) => {
                objTTS.funs.closeLoaderPanel();
                if (err) {
                    objTTS.funs.launchErrorModal('');
                    return false;
                }
            });
        });
    } else {
        objTTS.funs.closeLoaderPanel();
        if (params.message) {
            objTTS.funs.launchErrorModal('');
        }
    }
});

$(document).on('keydown', 'textarea', function() {
    $(this).parent().find('.text-counter-container').find('.text-counter').html($(this).val().length);
});

$(function() {
    objTTS.funs.openLoaderPanel();
    if (process.platform == 'win32' || process.platform == 'darwin') {
        // Habilitar control para exportar
        $('button#ctrl_btn_download').removeAttr('disabled');
    } else {
        // Deshabilitar control para exportar
        $('button#ctrl_btn_download').attr('disabled', 'disabled');
    }
    $.each($('textarea'), (i, ctrl) => {
        $(ctrl).parent().append(
            '<small class="text-counter-container w-100 text-end">' +
                '<p class="text-counter fw-lighter text-muted">0</p>' +
            '</small>'
        );
    });
    let my_vcs = [];
    // navigator.onLine
    if (process.platform == 'win32') {
        say.getInstalledVoices((err, voices) => {
            voices.forEach((v, i) => {
                my_vcs.push({
                    voice: v,
                    type: 'say'
                });
            });
            objTTS.vars.unu_voices = my_vcs;
            my_vcs.forEach((v, i) => {
                $('select#ctrl_select_voice').append('<option value="' + i + '">' + v.voice + '</option>');
            });
            setTimeout(()=> {
                objTTS.funs.closeLoaderPanel();
            }, 1000);
            /*if (objTTS.vars.ssu_available) {
                objTTS.funs.getSSU_Voices().then((voices) => {
                    voices.map((voice) => {});
                });
            }*/
        });
    } else {
        my_vcs.push({
            voice: 'Default',
            type: 'say'
        });
        objTTS.vars.unu_voices = my_vcs;
        my_vcs.forEach((v, i) => {
            $('select#ctrl_select_voice').append('<option value="' + i + '">' + v.voice + '</option>');
        });
        setTimeout(()=> {
            objTTS.funs.closeLoaderPanel();
        }, 1000);
    }
});
