from sim_core.repository import load_device_seed


def test_load_ngtos_device_seed():
    device = load_device_seed("topsec_branch_fw")

    assert device.vendor == "Topsec"
    assert device.os_type == "NGTOS"
    assert device.device_type == "ngfw"
    assert device.syslog.server == "127.0.0.1"


def test_load_ips_device_seed():
    device = load_device_seed("topsec_hq_ips")

    assert device.vendor == "Topsec"
    assert device.device_type == "ips"
    assert device.management_ip == "10.255.0.21"


def test_load_antivirus_device_seed():
    device = load_device_seed("topsec_dc_av")

    assert device.vendor == "Topsec"
    assert device.device_type == "av"
    assert device.management_ip == "10.255.0.31"
